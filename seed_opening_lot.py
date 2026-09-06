"""Create the opening lot: the complete contents of the barn loft.

The description and photo are baked in. The commercial terms are not, and are
required arguments on purpose. A binding auction listing is the wrong place for
a guessed starting price or a placeholder closing date.

    DATABASE_URL='postgresql://...' python seed_opening_lot.py \
        --start-price 2500 \
        --closes 2026-09-27T18:00 \
        --location 'Township, State'

Run clear_lots.py first if the board still has the old lots on it.
"""
import argparse
import os
import sys
from datetime import datetime

if not os.environ.get('DATABASE_URL'):
    sys.exit('DATABASE_URL is not set. Refusing to write to the local SQLite '
             'file by accident. Set it to the database you actually mean.')

import app as A  # noqa: E402

TITLE = 'The Barn Loft, Complete Contents'

# Written against what the photograph actually shows. The photo frames the
# sheet metal wall only, so the description says so rather than implying the
# single image covers the whole lot.
DESCRIPTION = """Everything on the upper floor of the barn, sold as one lot.

The contents are mixed, and the photographs show both sides. One wall is \
automotive sheet metal: fenders, bumper covers, and door skins stacked against \
the planking, with an alloy wheel at floor level. The opposite wall is \
powersports, mostly scooter and moped seating with moulded fairings and body \
panels stacked several deep. Loose trim is laid up in the rafters overhead and \
a plank aisle runs between the two sides.

Say plainly what that means for you: this is not a pure classic car lot. If \
you are only after the automotive side, you are still buying the rest of the \
room with it.

Nothing has been sorted, cleaned, or moved for the photographs. The building \
has been under roof and out of the weather, so expect dust and surface rust \
rather than structural rot.

This is a clearance lot. You are buying the room, not a picked selection from \
it. Quantities are not itemised and no inventory list exists.

Inspection is strongly advised before bidding on something this size. Bring \
help, and bring a vehicle that will take a full load. Collection is in person \
and payment is cash on collection."""

IMAGE_URL = '/static/images/lot-barn-loft.jpg'

# Same photograph, different parts of the room. Nothing here is a separate
# shoot, so the gallery cannot imply more coverage than actually exists.
EXTRA_IMAGES = '\n'.join([
    '/static/images/lot-barn-loft-2.jpg',
    '/static/images/lot-barn-loft-3.jpg',
])


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--start-price', type=float, required=True,
                   help='opening bid in dollars')
    p.add_argument('--closes', required=True,
                   help='close time, ISO 8601 UTC, e.g. 2026-09-27T18:00')
    p.add_argument('--location', required=True,
                   help='collection area shown to bidders')
    p.add_argument('--reserve', type=float, default=0,
                   help='reserve price, 0 for none (default: 0)')
    p.add_argument('--increment', type=float, default=50.0,
                   help='minimum bid increment (default: 50)')
    p.add_argument('--condition', default='As found, stored dry')
    p.add_argument('--opens', default=None,
                   help='open time, ISO 8601 UTC. Default: now, so it goes live '
                        'immediately.')
    args = p.parse_args()

    end = datetime.fromisoformat(args.closes)
    start = datetime.fromisoformat(args.opens) if args.opens else datetime.utcnow()
    if end <= start:
        sys.exit('--closes is not after the open time. Nothing created.')

    with A.app.app_context():
        if A.Auction.query.filter_by(title=TITLE).first():
            sys.exit('A lot titled %r already exists. Delete it first if you '
                     'meant to recreate it.' % TITLE)

        lot = A.Auction(
            title=TITLE,
            description=DESCRIPTION,
            shed_type='Complete contents',
            location=args.location,
            condition=args.condition,
            starting_price=args.start_price,
            current_price=args.start_price,
            reserve_price=args.reserve,
            bid_increment=args.increment,
            image_url=IMAGE_URL,
            extra_images=EXTRA_IMAGES,
            start_time=start,
            end_time=end,
            is_active=True,
        )
        A.db.session.add(lot)
        A.db.session.commit()

        print('Created lot %d: %s' % (lot.id, lot.title))
        print('  status:   %s' % lot.status)
        print('  opens:    %s UTC' % start.strftime('%Y-%m-%d %H:%M'))
        print('  closes:   %s UTC' % end.strftime('%Y-%m-%d %H:%M'))
        print('  opening:  $%.2f  (increment $%.2f, reserve $%.2f)'
              % (args.start_price, args.increment, args.reserve))
        print('  photos:   %d' % len(lot.images))
        print('\nRebuild the marketing site so the lot is baked into the static '
              'HTML for crawlers.')


if __name__ == '__main__':
    main()
