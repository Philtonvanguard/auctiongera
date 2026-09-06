"""Delete auction lots from whichever database DATABASE_URL points at.

This exists because clearing lots is a production data operation and the admin
dashboard deletes one at a time. Run it against Render to empty the board before
relisting:

    DATABASE_URL='postgresql://...' python clear_lots.py

Keep specific lots by id:

    DATABASE_URL='postgresql://...' python clear_lots.py --keep 12 --keep 15

Nothing is deleted until you retype the count, so a stray Enter is harmless.
Bids go first: Bid.auction_id is a foreign key, and Postgres refuses to drop a
lot that still has bids pointing at it. SQLite is laxer, which is exactly how
this kind of thing passes locally and fails on the live database.
"""
import argparse
import os
import sys

if not os.environ.get('DATABASE_URL'):
    sys.exit('DATABASE_URL is not set. Refusing to run against the local SQLite '
             'file by accident. Set it to the database you actually mean.')

# Importing app runs init_db(), which is fine: it only creates missing tables.
import app as A  # noqa: E402


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--keep', type=int, action='append', default=[],
                        metavar='ID', help='lot id to preserve, repeatable')
    parser.add_argument('--yes', action='store_true',
                        help='skip the confirmation prompt (for scripted use)')
    args = parser.parse_args()

    with A.app.app_context():
        query = A.Auction.query
        if args.keep:
            query = query.filter(A.Auction.id.notin_(args.keep))
        lots = query.order_by(A.Auction.id).all()

        if not lots:
            print('Nothing to delete.')
            return

        # Show the target before asking. A confirmation prompt that does not
        # say what it is about to destroy is not a confirmation.
        print('Database: %s' % A.app.config['SQLALCHEMY_DATABASE_URI'].split('@')[-1])
        print('\nWill delete %d lot(s):\n' % len(lots))
        for lot in lots:
            print('  [%4d] %-44s %-9s %d bid(s)'
                  % (lot.id, lot.title[:44], lot.status, lot.bid_count))
        if args.keep:
            print('\nKeeping: %s' % ', '.join(str(i) for i in sorted(args.keep)))

        if not args.yes:
            answer = input('\nType %d to confirm, anything else to abort: ' % len(lots))
            if answer.strip() != str(len(lots)):
                print('Aborted. Nothing was deleted.')
                return

        ids = [lot.id for lot in lots]
        bids = A.Bid.query.filter(A.Bid.auction_id.in_(ids)).delete(
            synchronize_session=False)
        A.Auction.query.filter(A.Auction.id.in_(ids)).delete(
            synchronize_session=False)
        A.db.session.commit()
        print('\nDeleted %d lot(s) and %d bid(s).' % (len(ids), bids))


if __name__ == '__main__':
    main()
