"""Relist the barn lot: new dates, house style, self-hosted photos.

The live record uses em-dashes as pause breaks in four places, which house
style does not allow. They are real U+2014 characters and the data is not
corrupted; a terminal that cannot render them shows a replacement box, which
is easy to mistake for mojibake. Its photo is a 640x360 webp on a free
third-party host, and its end date is in the past, so the site currently
shows no open auction.

Run it against the live database. The connection string is prompted for and
hidden rather than taken from a flag, so it stays out of your shell history:

    python relist_lot.py

Or set DATABASE_URL yourself and it will use that. Nothing is written until
you confirm, and it prints the before and after first.
"""
import argparse
import getpass
import os
import sys
from datetime import datetime

CLOSES_DEFAULT = '2026-10-28T23:00'   # 7:00 PM Eastern on 28 Oct 2026

TITLE = ('Barn Find Lot: Massive Collection of Car Seats, Body Panels, '
         'Wheels and More. Whole Lot, As-Is')

LOCATION = 'Newark, Delaware'

# The owner's own copy, kept intact. Only three things changed: em-dashes are
# rewritten out per house style, "&" is spelled out, and a paragraph was added
# telling bidders to make contact before travelling. The facts are his, not
# inferred from a photograph.
DESCRIPTION = """You are bidding on an entire barn packed floor-to-rafters \
with automotive parts. This is a full lot, single bid. Everything inside goes \
to the winner.

As you can see from the photos, the barn is absolutely loaded. Visible \
inventory includes a large quantity of car seats in various styles and colors, \
body panels, doors, fenders, bumpers, wheels and rims, and miscellaneous \
automotive parts stacked throughout, including parts stored in the rafters \
above. The collection spans multiple makes and models including BMW and other \
domestic and foreign vehicles, ranging from older classics to more modern cars.

This is a serious haul for the right buyer. Resellers, auto recyclers, \
restoration shops, and collectors will find real value here. Everything is \
sold strictly as-is, where-is. No cherry-picking, no partial lots.

What you are getting:

Stacked car seats (multiple makes, styles, colors)
Body panels, doors, and bumper components
Wheels and rims
Additional parts stored in the rafters
BMW and mixed make and model inventory
Full barn, what you see is what you get

The lot is in Newark, Delaware. The exact address is given once we have \
spoken, either because you have arranged a viewing or because you have won. \
Please do not turn up unannounced. Contact us and we will sort out a time.

Buyer is responsible for removal of all items. Local pickup only. All sales \
final. Inspect before bidding if possible."""

# Self-hosted, higher resolution than the 640x360 currently on the listing,
# and framed so no identifiable person appears in a public commercial listing.
IMAGE_URL = '/static/images/lot-barn-loft.jpg'
EXTRA_IMAGES = '\n'.join([
    '/static/images/lot-barn-loft-2.jpg',
    '/static/images/lot-barn-loft-3.jpg',
])


def resolve_url(url_file):
    """Get the connection string without it landing in shell history.

    Order: a file, then a hidden prompt, then a visible one. The visible
    fallback exists because classic cmd.exe frequently ignores Ctrl+V at a
    getpass prompt, so the paste never arrives and Enter submits an empty
    string, which looks exactly like the script ignoring you.
    """
    if url_file:
        with open(url_file, encoding='utf-8') as handle:
            for line in handle:
                if line.strip():
                    return line.strip()
        sys.exit('%s is empty. Nothing changed.' % url_file)

    url = getpass.getpass('Render DATABASE_URL (hidden, nothing will appear): ').strip()
    if url:
        return url

    print('\nNothing arrived. In cmd.exe try right-click to paste rather than')
    print('Ctrl+V, or press Enter again to type it where you can see it.')
    if input('Show the text as you paste it? [y/N]: ').strip().lower() != 'y':
        sys.exit('No connection string given. Nothing changed.')

    url = input('Render DATABASE_URL (visible): ').strip()
    if not url:
        sys.exit('No connection string given. Nothing changed.')
    print('\nThat string is now in this window\'s scrollback. Close the window '
          'when you are done.')
    return url


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--id', type=int, default=1, help='lot id (default: 1)')
    p.add_argument('--url-file', metavar='PATH',
                   help='read the connection string from this file instead of '
                        'prompting, then delete the file')
    p.add_argument('--closes', default=CLOSES_DEFAULT,
                   help='close time, ISO 8601 UTC (default: %s)' % CLOSES_DEFAULT)
    p.add_argument('--yes', action='store_true', help='skip the confirmation')
    args = p.parse_args()

    end = datetime.fromisoformat(args.closes)
    start = datetime.utcnow()
    if end <= start:
        sys.exit('--closes is in the past. Nothing changed.')

    if not os.environ.get('DATABASE_URL'):
        os.environ['DATABASE_URL'] = resolve_url(args.url_file)

    import app as A  # imported late: app.py reads DATABASE_URL at import time

    with A.app.app_context():
        lot = A.db.session.get(A.Auction, args.id)
        if lot is None:
            sys.exit('No lot with id %d.' % args.id)

        print('\nBEFORE')
        print('  title    %s' % lot.title)
        print('  status   %s   (ends %s UTC)'
              % (lot.status, lot.end_time.strftime('%Y-%m-%d %H:%M')))
        print('  location %r' % lot.location)
        print('  photos   %d  %s' % (len(lot.images), lot.images))
        print('  em-dashes in title/description: %d'
              % (lot.title.count('—') + (lot.description or '').count('—')))

        lot.title = TITLE
        lot.description = DESCRIPTION
        lot.location = LOCATION
        lot.image_url = IMAGE_URL
        lot.extra_images = EXTRA_IMAGES
        lot.start_time = start
        lot.end_time = end
        lot.is_active = True

        print('\nAFTER')
        print('  title    %s' % lot.title)
        print('  status   %s   (ends %s UTC)'
              % (lot.status, end.strftime('%Y-%m-%d %H:%M')))
        print('  location %r' % lot.location)
        print('  photos   %d  %s' % (len(lot.images), lot.images))
        print('  em-dashes in title/description: %d'
              % (lot.title.count('—') + lot.description.count('—')))
        print('\n  price and bid increment are untouched: $%.2f, $%.2f steps'
              % (lot.current_price, lot.bid_increment))

        if not args.yes:
            if input('\nApply this? Type yes: ').strip().lower() != 'yes':
                A.db.session.rollback()
                print('Rolled back. Nothing changed.')
                return

        A.db.session.commit()
        print('\nDone. Lot %d is %s and closes %s UTC.'
              % (lot.id, lot.status, end.strftime('%Y-%m-%d %H:%M')))
        print('Rebuild and redeploy the marketing site so crawlers see it:')
        print('  cd web && AUCTION_API_URL=https://auctiongera.onrender.com '
              'SITE_URL=https://auctiongera.bid npm run build')
        print('  npx wrangler pages deploy out --project-name auctiongera --branch main')


if __name__ == '__main__':
    main()
