"""
AuctionGera — Startup Script
Run this to start the server: python run.py
"""
from app import app, init_db

if __name__ == '__main__':
    init_db()
    print('\n' + '='*50)
    print('  AuctionGera is running!')
    print('='*50)
    print('  URL:   http://localhost:5000')
    print('  Admin: http://localhost:5000/admin')
    print('  User:  admin')
    print('  Pass:  admin123')
    print('='*50 + '\n')
    app.run(debug=True, host='0.0.0.0', port=5000)
