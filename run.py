"""
AuctionGera - Startup Script
Run this to start the server: python run.py

Binds to localhost only. Set HOST=0.0.0.0 to expose it on the network, and
only do that behind a real WSGI server, never with the debugger enabled.
The Werkzeug debugger executes arbitrary Python from the browser, so it is
opt-in via FLASK_DEBUG=1 and must never be combined with a public HOST.
"""
import os

from app import app, init_db

if __name__ == '__main__':
    init_db()
    host = os.environ.get('HOST', '127.0.0.1')
    debug = os.environ.get('FLASK_DEBUG') == '1'
    if debug and host != '127.0.0.1':
        raise SystemExit('Refusing to start: FLASK_DEBUG=1 with HOST=%s exposes a remote shell.' % host)
    print('\n' + '='*50)
    print('  AuctionGera is running!')
    print('='*50)
    print('  URL:   http://%s:5000' % host)
    print('  Admin: http://%s:5000/admin' % host)
    print('  Admin login comes from the ADMIN_PASSWORD env var.')
    print('='*50 + '\n')
    app.run(debug=debug, host=host, port=5000)
