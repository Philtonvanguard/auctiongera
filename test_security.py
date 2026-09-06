"""Smoke checks for the auth/bid paths. Run: python test_security.py"""
import io
import re
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
def test_admin_password_resets_on_existing_account():
    """The whole point of the env var: a leaked or forgotten admin password is
    fixed by editing ADMIN_PASSWORD and redeploying, with no database surgery."""
    os.environ['ADMIN_PASSWORD'] = 'a completely different passphrase'
    A.init_db()
    with A.app.app_context():
        admin = A.User.query.filter_by(username='admin').first()
        assert admin.check_password('a completely different passphrase'), \
            'ADMIN_PASSWORD did not reset the existing admin password'
        assert not admin.check_password('correct horse battery staple'), \
            'the old password still works after a reset'
        assert A.User.query.filter_by(username='admin').count() == 1, \
            'reset created a duplicate admin instead of updating'


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
def test_bid_sends_an_alert_email_with_real_numbers():
    """Bid alerts previously POSTed to a decommissioned duckdns host and the
    failure was swallowed, so nobody knew mail had stopped."""
    sent = []
    A.send_alert_email = lambda subject, text, reply_to=None: sent.append(
        {'subject': subject, 'text': text, 'reply_to': reply_to})

    with A.app.app_context():
        user = A.User(username='mailer', email='mailer@example.com')
        user.set_password('pw')
        now = datetime.utcnow()
        auction = A.Auction(
            title='Fender Pair', description='d', shed_type='Body panels',
            starting_price=300.0, current_price=300.0, bid_increment=25.0,
            start_time=now - timedelta(hours=1), end_time=now + timedelta(hours=1))
        A.db.session.add_all([user, auction])
        A.db.session.commit()
        auction_id = auction.id

    client = A.app.test_client()
    client.post('/login', data={'username': 'mailer', 'password': 'pw'})
    res = client.post('/auction/%d/bid' % auction_id, json={'amount': 500.0})
    assert res.get_json()['success'], res.get_json()

    assert sent, 'a bid produced no alert email'
    alert = sent[0]
    assert '500' in alert['subject'], alert['subject']
    assert '$300.00' in alert['text'], 'previous price missing from the alert'
    assert alert['reply_to'] == 'mailer@example.com'


@check
def test_no_dead_webhook_defaults():
    """A hardcoded default pointing at a dead host is worse than no default:
    it looks configured and delivers nothing."""
    source = io.open('app.py', encoding='utf-8').read()
    code = ' '.join(l for l in source.splitlines()
                    if not l.lstrip().startswith('#'))
    assert 'duckdns.org' not in code, 'the decommissioned duckdns default is back'


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

    # Set the admin password here rather than relying on an earlier test, so
    # this check does not break when another test changes it.
    password = 'analytics check password'
    os.environ['ADMIN_PASSWORD'] = password
    A.init_db()

    client = A.app.test_client()
    client.post('/login', data={'username': 'admin', 'password': password})
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


@check
def test_privacy_request_is_stored_before_confirming():
    """The page may only claim "request received" for a row that exists. The old
    version opened a mailto: link and confirmed unconditionally, so anyone
    without a mail handler lost their request and was told it had worked."""
    client = A.app.test_client()
    res = client.post('/opt-out', json={
        'email': 'bidder@example.com',
        'username': 'bidder',
        'request': 'delete',
        'notes': 'please remove everything',
    })
    assert res.status_code == 201, 'valid request returned %s' % res.status_code
    reference = res.get_json()['id']

    with A.app.app_context():
        stored = A.db.session.get(A.PrivacyRequest, reference)
        assert stored is not None, 'endpoint confirmed a request it never stored'
        assert stored.email == 'bidder@example.com'
        assert stored.kind == 'delete'


@check
def test_privacy_request_rejects_junk_without_storing_it():
    """This is the statutory rights channel. A request we cannot act on has to
    fail visibly rather than land in the table as an unactionable row."""
    client = A.app.test_client()
    with A.app.app_context():
        before = A.PrivacyRequest.query.count()

    for payload, label in (
        ({'email': 'bidder@example.com', 'request': 'drop-tables'}, 'unknown request kind'),
        ({'email': 'not-an-email', 'request': 'delete'}, 'malformed email'),
        ({'email': 'missing@tld', 'request': 'delete'}, 'email with no TLD'),
        ({'email': '', 'request': 'delete'}, 'empty email'),
    ):
        res = client.post('/opt-out', json=payload)
        assert res.status_code == 400, '%s was accepted (%s)' % (label, res.status_code)
        assert 'error' in res.get_json(), '%s returned no error message' % label

    with A.app.app_context():
        assert A.PrivacyRequest.query.count() == before, 'a rejected request was stored anyway'


@check
def test_chat_embed_is_not_loaded_without_consent():
    """Tawk.to sets third-party cookies and receives the signed-in user's name
    and email, so the embed must never be in the HTML. consent.js injects it
    after opt-in, and not at all when Global Privacy Control is set."""
    A.app.config['TAWK_PROPERTY_ID'] = 'test-property'
    A.app.config['TAWK_WIDGET_ID'] = 'test-widget'
    try:
        html = A.app.test_client().get('/opt-out').data.decode()
        assert 'embed.tawk.to' not in html, 'chat embed ships in the page unasked'
        assert 'consent.js' in html, 'consent gate is not loaded, so chat can never start'
    finally:
        A.app.config['TAWK_PROPERTY_ID'] = ''
        A.app.config['TAWK_WIDGET_ID'] = ''


def _lot(**kw):
    now = datetime.utcnow()
    defaults = dict(title='t', description='d', shed_type='c', starting_price=1,
                    current_price=1, start_time=now - timedelta(days=1),
                    end_time=now + timedelta(days=1))
    defaults.update(kw)
    return A.Auction(**defaults)


@check
def test_gallery_orders_cover_first_and_drops_duplicates():
    """One accessor feeds the card, the detail page, and the JSON, so they
    cannot disagree about which photo leads."""
    lot = _lot(image_url='/a.jpg', extra_images='/b.jpg\n/c.jpg')
    assert lot.images == ['/a.jpg', '/b.jpg', '/c.jpg'], lot.images

    # Pasting the cover into the extras box is the obvious mistake to make.
    dupe = _lot(image_url='/a.jpg', extra_images='/a.jpg\n/b.jpg')
    assert dupe.images == ['/a.jpg', '/b.jpg'], dupe.images

    # Blank lines and stray whitespace come free with a textarea.
    messy = _lot(image_url='/a.jpg', extra_images='\n  /b.jpg  \n\n\n')
    assert messy.images == ['/a.jpg', '/b.jpg'], messy.images

    assert _lot(image_url='', extra_images='').images == []
    assert _lot(image_url='', extra_images=None).images == []
    # A lot with no cover but extras should still show its photos.
    assert _lot(image_url='', extra_images='/b.jpg').images == ['/b.jpg']


@check
def test_lots_feed_carries_the_gallery():
    with A.app.app_context():
        lot = _lot(title='Gallery lot', image_url='/a.jpg', extra_images='/b.jpg')
        A.db.session.add(lot)
        A.db.session.commit()

    payload = A.app.test_client().get('/api/lots').get_json()
    entry = next(l for l in payload if l['title'] == 'Gallery lot')
    assert entry['images'] == ['/a.jpg', '/b.jpg'], entry.get('images')
    # image_url stays so anything reading the old field keeps working.
    assert entry['image_url'] == '/a.jpg'
    assert 'reserve_price' not in entry, 'gallery change leaked the reserve price'


@check
def test_missing_column_migration_is_idempotent_and_real():
    """db.create_all() adds tables, never columns. Without the migration the
    live Postgres keeps an auction table with no extra_images and every query
    against it fails, while a fresh local SQLite file looks perfectly fine."""
    from sqlalchemy import inspect
    with A.app.app_context():
        columns = {c['name'] for c in inspect(A.db.engine).get_columns('auction')}
        assert 'extra_images' in columns, 'init_db did not add the column'

        # Re-running must not raise: it happens on every restart and redeploy.
        A._add_missing_columns()
        A._add_missing_columns()


@check
def test_admin_form_keeps_a_category_not_in_the_dropdown():
    """A lot saved under an older category must stay selected when edited.

    The category list was rewritten from shed types to parts types. Any lot
    still on an old value would match no option, so the browser would display
    the first one and saving would rewrite the category to something the owner
    never picked. Silent, and only visible later as wrong data.
    """
    password = 'category dropdown check'
    os.environ['ADMIN_PASSWORD'] = password
    A.init_db()

    with A.app.app_context():
        lot = _lot(title='Legacy category lot', shed_type='Barn')
        A.db.session.add(lot)
        A.db.session.commit()
        lot_id = lot.id

    client = A.app.test_client()
    client.post('/login', data={'username': 'admin', 'password': password})
    html = client.get('/admin/auction/%d/edit' % lot_id).data.decode()

    select = html.split('name="shed_type"', 1)[1].split('</select>', 1)[0]
    assert '<option value="Barn"' in select, 'the lot\'s own category vanished'
    assert 'value="Barn" selected' in select.replace('  ', ' '), \
        'category present but not selected, so saving would silently change it'


@check
def test_next_only_accepts_on_site_paths():
    """?next= must not be able to send a freshly signed-in user off-site."""
    for hostile in ('https://evil.example/x', 'http://evil.example',
                    '//evil.example/x', 'javascript:alert(1)',
                    'http://auctiongera.onrender.com/auction/1'):
        assert A.safe_next(hostile) is None, 'accepted %r' % hostile
    for ok in ('/auction/1', '/lots', '/admin/analytics'):
        assert A.safe_next(ok) == ok, 'rejected %r' % ok
    assert A.safe_next(None) is None and A.safe_next('') is None


@check
def test_login_to_bid_link_stays_on_this_domain():
    """Behind Cloudflare, Flask sees the Render host because X-Forwarded-Host
    is not honoured. Building next= from request.url therefore pointed at
    auctiongera.onrender.com, where the session cookie does not exist, so a
    successful login landed the bidder looking signed out."""
    with A.app.app_context():
        lot = _lot(title='Live lot for link check')
        A.db.session.add(lot)
        A.db.session.commit()
        lot_id = lot.id

    html = A.app.test_client().get(
        '/auction/%d' % lot_id,
        headers={'Host': 'auctiongera.onrender.com',
                 'X-Forwarded-Host': 'auctiongera.bid'}).data.decode()

    links = re.findall(r'href="([^"]*next=[^"]*)"', html)
    assert links, 'the Login to Bid link did not render for a live lot'
    for link in links:
        assert 'onrender.com' not in link, link
        assert 'http' not in link.split('next=')[1], 'next= is absolute: %s' % link


@check
def test_sign_in_accepts_email_and_ignores_case():
    with A.app.app_context():
        u = A.User(username='BarnBuyer', email='Buyer@Example.com')
        u.set_password('a good long passphrase')
        A.db.session.add(u)
        A.db.session.commit()

    for identifier in ('BarnBuyer', 'barnbuyer', 'Buyer@Example.com',
                       'buyer@example.com'):
        client = A.app.test_client()
        res = client.post('/login',
                          data={'username': identifier,
                                'password': 'a good long passphrase'})
        assert res.status_code == 302, '%r did not sign in' % identifier
        me = client.get('/api/me').get_json()
        assert me['authenticated'] and me['username'] == 'BarnBuyer', identifier

    bad = A.app.test_client().post(
        '/login', data={'username': 'barnbuyer', 'password': 'wrong'})
    assert bad.status_code == 200, 'a wrong password was accepted'


@check
def test_register_blocks_case_variant_duplicates():
    """Login matches case-insensitively, so allowing both "Phil" and "phil"
    would make a sign-in ambiguous and hand over whichever row came first."""
    client = A.app.test_client()
    form = dict(username='DupCheck', email='dup@example.com',
                password='a good long passphrase',
                confirm_password='a good long passphrase')
    client.post('/register', data=form)

    client.post('/register', data=dict(form, username='dupcheck',
                                       email='other@example.com'))
    client.post('/register', data=dict(form, username='Other',
                                       email='DUP@example.com'))
    with A.app.app_context():
        assert A.User.query.filter(
            A.db.func.lower(A.User.username) == 'dupcheck').count() == 1
        assert A.User.query.filter(
            A.db.func.lower(A.User.email) == 'dup@example.com').count() == 1


@check
def test_api_me_is_never_cached():
    """It sits behind a CDN. A cached response would hand one visitor's name
    to the next person through the same edge."""
    res = A.app.test_client().get('/api/me')
    assert res.get_json() == {'authenticated': False}, res.get_json()
    assert 'no-store' in res.headers.get('Cache-Control', ''), res.headers


if __name__ == '__main__':
    for fn in CHECKS:
        fn()
        print('ok  ', fn.__name__)
    print('all checks passed')
