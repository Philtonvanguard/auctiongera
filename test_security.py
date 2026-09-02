"""Smoke checks for the auth/bid paths. Run: python test_security.py"""
import io
import os, sys, tempfile
from datetime import datetime, timedelta

os.environ.pop('ADMIN_PASSWORD', None)
os.environ['DATABASE_URL'] = 'sqlite:///' + os.path.join(tempfile.mkdtemp(), 't.db')
os.environ['SECRET_KEY'] = 'test-key'

import app as A

# app.py runs init_db() on import. Snapshot the result now, before any test sets
# ADMIN_PASSWORD, so test order cannot affect this check.
with A.app.app_context():
    ADMIN_AT_IMPORT = A.User.query.filter_by(username='admin').first()

CHECKS = []


def check(fn):
    CHECKS.append(fn)
    return fn


@check
def test_no_admin_without_env_password():
    message = 'admin was bootstrapped without ADMIN_PASSWORD - published-credentials hole is back'
    assert ADMIN_AT_IMPORT is None, message


@check
def test_admin_created_from_env_password():
    os.environ['ADMIN_PASSWORD'] = 'correct horse battery staple'
    A.init_db()
    with A.app.app_context():
        admin = A.User.query.filter_by(username='admin').first()
        assert admin and admin.is_admin, 'ADMIN_PASSWORD set but no admin created'
        assert admin.check_password('correct horse battery staple')
        assert not admin.check_password('admin123'), 'default password still accepted'


@check
def test_bid_webhook_reports_real_previous_price():
    sent = []
    A.notify_n8n = lambda url, data: sent.append(data)

    with A.app.app_context():
        user = A.User(username='bidder', email='b@example.com')
        user.set_password('pw')
        now = datetime.utcnow()
        auction = A.Auction(
            title='Shed', description='d', shed_type='Garden',
            starting_price=1000.0, current_price=1000.0, bid_increment=50.0,
            start_time=now - timedelta(hours=1), end_time=now + timedelta(hours=1))
        A.db.session.add_all([user, auction])
        A.db.session.commit()
        auction_id = auction.id

    client = A.app.test_client()
    client.post('/login', data={'username': 'bidder', 'password': 'pw'})
    # Bid well above the 1050 minimum. The buggy version reported 1200-50=1150.
    res = client.post('/auction/%d/bid' % auction_id, json={'amount': 1200.0})
    assert res.get_json()['success'], res.get_json()

    bid_event = next(d for d in sent if d.get('type') == 'new_bid')
    assert bid_event['previous_price'] == 1000.0, \
        'previous_price was %r, expected 1000.0' % bid_event['previous_price']
    assert bid_event['amount'] == 1200.0


@check
def test_lots_feed_never_exposes_reserve_price():
    """The reserve is the seller's floor. Leaking it lets bidders stop just under it."""
    with A.app.app_context():
        now = datetime.utcnow()
        A.db.session.add(A.Auction(
            title='Wheels', description='d', shed_type='Wheels',
            starting_price=200.0, current_price=200.0, reserve_price=900.0,
            start_time=now - timedelta(hours=1), end_time=now + timedelta(days=1)))
        A.db.session.commit()

    res = A.app.test_client().get('/api/lots')
    assert res.status_code == 200, res.status_code
    lots = res.get_json()
    assert lots, 'feed returned no lots'
    for lot in lots:
        assert 'reserve_price' not in lot, 'reserve price leaked into the public feed'
        assert lot['status'] in ('live', 'upcoming', 'ended', 'cancelled')


@check
def test_analytics_uses_no_sqlite_only_sql():
    """Production runs Postgres. date(ts,'unixepoch') is SQLite-only and raised
    there, which silently broke the whole analytics page."""
    source = io.open('app.py', encoding='utf-8').read()
    # Ignore comments, which legitimately mention the old broken call.
    code = ' '.join(l for l in source.splitlines()
                    if not l.lstrip().startswith('#'))
    # Only "unixepoch" is checked. Python's own .strftime() is fine; it was the
    # SQL-side SQLite date function that raised on Postgres.
    assert 'unixepoch' not in code, 'SQLite-only SQL is back in app.py'


@check
def test_analytics_page_renders_for_admin():
    with A.app.app_context():
        now = int(datetime.utcnow().timestamp())
        for offset in (0, 86400, 172800):
            A.db.session.add(A.PageView(path='/', ref=None, ts=now - offset))
        A.db.session.commit()

    client = A.app.test_client()
    # Created by test_admin_created_from_env_password.
    client.post('/login', data={'username': 'admin', 'password': 'correct horse battery staple'})
    res = client.get('/admin/analytics')
    assert res.status_code == 200, 'analytics returned %s' % res.status_code
    assert b'3' in res.data, 'expected the three seeded days to be counted'


@check
def test_run_py_refuses_public_host_with_debugger():
    """debug=True on a public host is a remote shell. run.py must refuse to start."""
    import subprocess
    env = dict(os.environ, FLASK_DEBUG='1', HOST='0.0.0.0')
    r = subprocess.run([sys.executable, 'run.py'], env=env,
                       capture_output=True, text=True, timeout=60)
    assert r.returncode != 0, 'run.py started with FLASK_DEBUG=1 on 0.0.0.0'
    assert 'Refusing to start' in (r.stderr + r.stdout), (r.stdout, r.stderr)


if __name__ == '__main__':
    for fn in CHECKS:
        fn()
        print('ok  ', fn.__name__)
    print('all checks passed')
