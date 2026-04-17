from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, session
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timezone
import os
import uuid
import threading
import requests as http_requests

N8N_BID_WEBHOOK = os.environ.get('N8N_BID_WEBHOOK', 'https://myauction.duckdns.org/webhook/new-bid')
N8N_PAYMENT_WEBHOOK = os.environ.get('N8N_PAYMENT_WEBHOOK', 'https://myauction.duckdns.org/webhook/auction-payment')


def notify_n8n(url, data):
    """Send notification to n8n webhook in background (non-blocking)."""
    def _send():
        try:
            http_requests.post(url, json=data, timeout=5)
        except Exception:
            pass
    threading.Thread(target=_send, daemon=True).start()

app = Flask(__name__)

# Use environment variables in production (Railway sets these automatically)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'auctiongera-secret-2024-secure-key')

# Use PostgreSQL on Railway if DATABASE_URL is set, else fall back to local SQLite
database_url = os.environ.get('DATABASE_URL', 'sqlite:///auctiongera.db')
# Railway provides postgres:// but SQLAlchemy needs postgresql://
if database_url.startswith('postgres://'):
    database_url = database_url.replace('postgres://', 'postgresql://', 1)
app.config['SQLALCHEMY_DATABASE_URI'] = database_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'
login_manager.login_message_category = 'info'


# ─── Models ───────────────────────────────────────────────────────────────────

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    bids = db.relationship('Bid', backref='bidder', lazy=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)


class Auction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    shed_type = db.Column(db.String(100), nullable=False)
    dimensions = db.Column(db.String(100))
    location = db.Column(db.String(200))
    condition = db.Column(db.String(50))
    starting_price = db.Column(db.Float, nullable=False)
    reserve_price = db.Column(db.Float, default=0)
    bid_increment = db.Column(db.Float, default=50.0)
    current_price = db.Column(db.Float, nullable=False)
    image_url = db.Column(db.String(500), default='')
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    bids = db.relationship('Bid', backref='auction', lazy=True, order_by='Bid.created_at.desc()')

    @property
    def status(self):
        now = datetime.utcnow()
        if not self.is_active:
            return 'cancelled'
        if now < self.start_time:
            return 'upcoming'
        if now > self.end_time:
            return 'ended'
        return 'live'

    @property
    def highest_bid(self):
        if self.bids:
            return max(self.bids, key=lambda b: b.amount)
        return None

    @property
    def bid_count(self):
        return len(self.bids)


class Bid(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    amount = db.Column(db.Float, nullable=False)
    auction_id = db.Column(db.Integer, db.ForeignKey('auction.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    ip_address = db.Column(db.String(50))


@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


# ─── Routes ───────────────────────────────────────────────────────────────────

@app.route('/')
def index():
    now = datetime.utcnow()
    live_auctions = Auction.query.filter(
        Auction.is_active == True,
        Auction.start_time <= now,
        Auction.end_time >= now
    ).order_by(Auction.end_time.asc()).all()

    upcoming_auctions = Auction.query.filter(
        Auction.is_active == True,
        Auction.start_time > now
    ).order_by(Auction.start_time.asc()).all()

    ended_auctions = Auction.query.filter(
        Auction.end_time < now
    ).order_by(Auction.end_time.desc()).limit(6).all()

    return render_template('index.html',
                           live_auctions=live_auctions,
                           upcoming_auctions=upcoming_auctions,
                           ended_auctions=ended_auctions)


@app.route('/auction/<int:auction_id>')
def auction_detail(auction_id):
    auction = Auction.query.get_or_404(auction_id)
    recent_bids = Bid.query.filter_by(auction_id=auction_id)\
        .order_by(Bid.created_at.desc()).limit(20).all()
    return render_template('auction_detail.html', auction=auction, recent_bids=recent_bids)


@app.route('/auction/<int:auction_id>/bid', methods=['POST'])
@login_required
def place_bid(auction_id):
    auction = Auction.query.get_or_404(auction_id)
    now = datetime.utcnow()

    if auction.status != 'live':
        return jsonify({'success': False, 'message': 'Auction is not currently active.'})

    try:
        bid_amount = float(request.json.get('amount', 0))
    except (ValueError, TypeError):
        return jsonify({'success': False, 'message': 'Invalid bid amount.'})

    min_bid = auction.current_price + auction.bid_increment
    if bid_amount < min_bid:
        return jsonify({'success': False,
                        'message': f'Minimum bid is ${min_bid:,.2f}'})

    bid = Bid(
        amount=bid_amount,
        auction_id=auction_id,
        user_id=current_user.id,
        ip_address=request.remote_addr
    )
    auction.current_price = bid_amount
    db.session.add(bid)
    db.session.commit()

    # Notify n8n — bid notification email
    notify_n8n(N8N_BID_WEBHOOK, {
        'type': 'new_bid',
        'auction_id': auction.id,
        'auction_title': auction.title,
        'bidder': current_user.username,
        'bidder_email': current_user.email,
        'amount': bid_amount,
        'bid_count': auction.bid_count,
        'previous_price': auction.current_price - auction.bid_increment,
        'end_time': auction.end_time.isoformat(),
    })

    # Notify n8n — log bid as transaction in Firefly III
    notify_n8n(N8N_PAYMENT_WEBHOOK, {
        'type': 'sale',
        'auction_id': auction.id,
        'auction_title': auction.title,
        'buyer': current_user.username,
        'seller': 'AuctionGera',
        'amount': bid_amount,
    })

    return jsonify({
        'success': True,
        'message': f'Bid of ${bid_amount:,.2f} placed successfully!',
        'new_price': bid_amount,
        'bid_count': auction.bid_count,
        'bidder': current_user.username
    })


@app.route('/auction/<int:auction_id>/status')
def auction_status(auction_id):
    auction = Auction.query.get_or_404(auction_id)
    recent_bids = Bid.query.filter_by(auction_id=auction_id)\
        .order_by(Bid.created_at.desc()).limit(5).all()

    bids_data = [{
        'bidder': b.bidder.username,
        'amount': b.amount,
        'time': b.created_at.strftime('%H:%M:%S')
    } for b in recent_bids]

    status = auction.status
    winner = None
    if status == 'ended' and auction.highest_bid:
        winner = auction.highest_bid.bidder.username
        # Check if we already notified about this auction ending
        session_key = f'ended_notified_{auction_id}'
        if not session.get(session_key):
            session[session_key] = True
            # Log platform fee (e.g. 10% commission)
            commission = round(auction.current_price * 0.10, 2)
            notify_n8n(N8N_PAYMENT_WEBHOOK, {
                'type': 'fee',
                'auction_id': auction.id,
                'auction_title': auction.title,
                'buyer': winner,
                'seller': 'AuctionGera',
                'amount': commission,
            })

    return jsonify({
        'status': status,
        'current_price': auction.current_price,
        'bid_count': auction.bid_count,
        'end_time': auction.end_time.isoformat(),
        'start_time': auction.start_time.isoformat(),
        'recent_bids': bids_data,
        'winner': winner
    })


# ─── Auth ─────────────────────────────────────────────────────────────────────

@app.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        email = request.form.get('email', '').strip()
        password = request.form.get('password', '')
        confirm = request.form.get('confirm_password', '')

        if not all([username, email, password, confirm]):
            flash('All fields are required.', 'danger')
            return render_template('register.html')
        if password != confirm:
            flash('Passwords do not match.', 'danger')
            return render_template('register.html')
        if User.query.filter_by(username=username).first():
            flash('Username already taken.', 'danger')
            return render_template('register.html')
        if User.query.filter_by(email=email).first():
            flash('Email already registered.', 'danger')
            return render_template('register.html')

        user = User(username=username, email=email)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        flash('Account created! Please log in.', 'success')
        return redirect(url_for('login'))

    return render_template('register.html')


@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '')
        user = User.query.filter_by(username=username).first()
        if user and user.check_password(password):
            login_user(user, remember=request.form.get('remember') == 'on')
            next_page = request.args.get('next')
            flash(f'Welcome back, {user.username}!', 'success')
            return redirect(next_page or url_for('index'))
        flash('Invalid username or password.', 'danger')
    return render_template('login.html')


@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash('You have been logged out.', 'info')
    return redirect(url_for('index'))


# ─── Admin ────────────────────────────────────────────────────────────────────

def admin_required(f):
    from functools import wraps
    @wraps(f)
    def decorated(*args, **kwargs):
        if not current_user.is_authenticated or not current_user.is_admin:
            flash('Admin access required.', 'danger')
            return redirect(url_for('index'))
        return f(*args, **kwargs)
    return decorated


@app.route('/admin')
@login_required
@admin_required
def admin_dashboard():
    auctions = Auction.query.order_by(Auction.created_at.desc()).all()
    users = User.query.order_by(User.created_at.desc()).all()
    total_bids = Bid.query.count()
    now = datetime.utcnow()
    live_count = sum(1 for a in auctions if a.status == 'live')
    return render_template('admin/dashboard.html',
                           auctions=auctions, users=users,
                           total_bids=total_bids, live_count=live_count, now=now)


@app.route('/admin/auction/new', methods=['GET', 'POST'])
@login_required
@admin_required
def admin_new_auction():
    if request.method == 'POST':
        try:
            start_time = datetime.strptime(request.form['start_time'], '%Y-%m-%dT%H:%M')
            end_time = datetime.strptime(request.form['end_time'], '%Y-%m-%dT%H:%M')
            starting_price = float(request.form['starting_price'])
            reserve_price = float(request.form.get('reserve_price', 0) or 0)
            bid_increment = float(request.form.get('bid_increment', 50) or 50)

            if end_time <= start_time:
                flash('End time must be after start time.', 'danger')
                return render_template('admin/auction_form.html', auction=None)

            auction = Auction(
                title=request.form['title'],
                description=request.form['description'],
                shed_type=request.form['shed_type'],
                dimensions=request.form.get('dimensions', ''),
                location=request.form.get('location', ''),
                condition=request.form.get('condition', 'Good'),
                starting_price=starting_price,
                reserve_price=reserve_price,
                bid_increment=bid_increment,
                current_price=starting_price,
                image_url=request.form.get('image_url', ''),
                start_time=start_time,
                end_time=end_time
            )
            db.session.add(auction)
            db.session.commit()
            flash('Auction created successfully!', 'success')
            return redirect(url_for('admin_dashboard'))
        except Exception as e:
            flash(f'Error creating auction: {str(e)}', 'danger')

    return render_template('admin/auction_form.html', auction=None)


@app.route('/admin/auction/<int:auction_id>/edit', methods=['GET', 'POST'])
@login_required
@admin_required
def admin_edit_auction(auction_id):
    auction = Auction.query.get_or_404(auction_id)
    if request.method == 'POST':
        try:
            auction.title = request.form['title']
            auction.description = request.form['description']
            auction.shed_type = request.form['shed_type']
            auction.dimensions = request.form.get('dimensions', '')
            auction.location = request.form.get('location', '')
            auction.condition = request.form.get('condition', 'Good')
            auction.starting_price = float(request.form['starting_price'])
            auction.reserve_price = float(request.form.get('reserve_price', 0) or 0)
            auction.bid_increment = float(request.form.get('bid_increment', 50) or 50)
            auction.image_url = request.form.get('image_url', '')
            auction.start_time = datetime.strptime(request.form['start_time'], '%Y-%m-%dT%H:%M')
            auction.end_time = datetime.strptime(request.form['end_time'], '%Y-%m-%dT%H:%M')
            db.session.commit()
            flash('Auction updated!', 'success')
            return redirect(url_for('admin_dashboard'))
        except Exception as e:
            flash(f'Error: {str(e)}', 'danger')
    return render_template('admin/auction_form.html', auction=auction)


@app.route('/admin/auction/<int:auction_id>/delete', methods=['POST'])
@login_required
@admin_required
def admin_delete_auction(auction_id):
    auction = Auction.query.get_or_404(auction_id)
    Bid.query.filter_by(auction_id=auction_id).delete()
    db.session.delete(auction)
    db.session.commit()
    flash('Auction deleted.', 'info')
    return redirect(url_for('admin_dashboard'))


@app.route('/admin/auction/<int:auction_id>/toggle', methods=['POST'])
@login_required
@admin_required
def admin_toggle_auction(auction_id):
    auction = Auction.query.get_or_404(auction_id)
    auction.is_active = not auction.is_active
    db.session.commit()
    return jsonify({'is_active': auction.is_active})


# ─── Init DB ──────────────────────────────────────────────────────────────────

def init_db():
    with app.app_context():
        db.create_all()
        # Create admin user if not exists
        if not User.query.filter_by(username='admin').first():
            admin = User(username='admin', email='admin@auctiongera.com', is_admin=True)
            admin.set_password('admin123')
            db.session.add(admin)
            db.session.commit()
            print('[OK] Admin user created: admin / admin123')


# Always run init_db so gunicorn (Railway) also creates tables on startup
init_db()

if __name__ == '__main__':
    print('[OK] AuctionGera running at http://localhost:5000')
    app.run(debug=True, host='0.0.0.0', port=5000)
