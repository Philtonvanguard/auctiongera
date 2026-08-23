"""Command line entry point.

    python -m scraper.cli scrape                 # seed + OSM, save to the DB
    python -m scraper.cli scrape --enrich        # also harvest emails off sites
    python -m scraper.cli scrape --dry-run       # print, do not touch the DB
    python -m scraper.cli list --top 20
    python -m scraper.cli export leads.csv
    python -m scraper.cli value --condition fair --assembly-share 0.5
    python -m scraper.cli outreach 3
    python -m scraper.cli create-lot-auction --days 10
"""

import argparse
import csv
import sys
from datetime import datetime, timedelta

from . import classify, config, pipeline

EXPORT_FIELDS = ['score', 'category', 'name', 'phone', 'email', 'website',
                 'address', 'city', 'state', 'postcode', 'distance_miles',
                 'distance_band', 'is_german_specialist', 'status', 'source',
                 'description', 'notes']


def _rows_from_db():
    from app import Lead, app
    with app.app_context():
        leads = Lead.query.order_by(Lead.score.desc(), Lead.name.asc()).all()
        return [{f: getattr(lead, f, None) for f in EXPORT_FIELDS}
                for lead in leads]


def cmd_scrape(args):
    sources = args.sources.split(',') if args.sources else ['seed', 'overpass', 'places']
    leads = pipeline.run(
        sources=sources,
        radius_miles=args.radius,
        do_enrich=args.enrich,
        enrich_limit=args.enrich_limit,
        persist=not args.dry_run,
    )
    print('\nTop {} leads:'.format(min(args.top, len(leads))))
    _print_table(leads[:args.top])
    if args.dry_run:
        print('\n(dry run - nothing written to the database)')
    return 0


def _print_table(leads):
    print('{:>5}  {:<22} {:<34} {:<16} {:>7}'.format(
        'SCORE', 'CATEGORY', 'NAME', 'PHONE', 'MILES'))
    print('-' * 92)
    for lead in leads:
        get = lead.get if isinstance(lead, dict) else (lambda k: getattr(lead, k, None))
        distance = get('distance_miles')
        print('{:>5}  {:<22} {:<34} {:<16} {:>7}'.format(
            get('score') or 0,
            (get('category') or '')[:22],
            (get('name') or '')[:34],
            classify.format_phone(get('phone'))[:16],
            '{:.0f}'.format(distance) if distance is not None else '-'))


def cmd_list(args):
    rows = _rows_from_db()
    if args.category:
        rows = [r for r in rows if r['category'] == args.category]
    print('{} leads in the database'.format(len(rows)))
    _print_table(rows[:args.top])
    return 0


def cmd_export(args):
    rows = _rows_from_db()
    handle = open(args.path, 'w', newline='', encoding='utf-8') if args.path else sys.stdout
    try:
        writer = csv.DictWriter(handle, fieldnames=EXPORT_FIELDS)
        writer.writeheader()
        for row in rows:
            row['phone'] = classify.format_phone(row.get('phone'))
            writer.writerow(row)
    finally:
        if args.path:
            handle.close()
            print('Wrote {} leads to {}'.format(len(rows), args.path))
    return 0


def _valuation_from_args(args):
    import valuation
    counts = dict(valuation.DEFAULT_MIX)
    if args.fenders is not None:
        counts['fender'] = args.fenders
    if args.hoods is not None:
        counts['hood'] = args.hoods
    if args.doors is not None:
        counts['door'] = args.doors
    return valuation.value_lot(
        counts=counts,
        assembly_share=args.assembly_share,
        condition=args.condition,
        demand=args.demand,
        paint_coded=args.paint_coded,
        commission_rate=args.commission,
        logistics_cost=args.logistics,
    )


def cmd_value(args):
    import valuation
    result = _valuation_from_args(args)
    print(valuation.summary_lines(result))
    print('\n  Suggested opening bid : ${:,.0f}'.format(valuation.recommended_start(result)))
    print('  Suggested reserve     : ${:,.0f}'.format(valuation.recommended_reserve(result)))
    return 0


def cmd_outreach(args):
    import outreach
    from app import Lead, app, db
    result = _valuation_from_args(args)
    with app.app_context():
        lead = db.session.get(Lead, args.lead_id)
        if not lead:
            print('No lead with id {}'.format(args.lead_id))
            return 1
        print('=== {} ({}) ==='.format(lead.name, lead.category))
        print('Phone: {}   Email: {}'.format(
            classify.format_phone(lead.phone) or '-', lead.email or '-'))
        print('\n--- Call script ---\n{}'.format(outreach.call_script(lead)))
        email = outreach.build_email(
            lead, result,
            seller_name=args.seller_name,
            seller_phone=args.seller_phone,
            seller_email=args.seller_email)
        print('\n--- Email ---\nSubject: {}\n\n{}'.format(email['subject'], email['body']))
    return 0


def cmd_create_lot_auction(args):
    """Create the parts-lot listing on the AuctionGera site itself."""
    import valuation
    from app import Auction, app, db

    result = _valuation_from_args(args)
    start = valuation.recommended_start(result)
    reserve = valuation.recommended_reserve(result)
    mix = ', '.join('{} {}'.format(line['count'], line['label'].split(' (')[0].lower())
                    for line in result['lines'])

    description = (
        'Single lot of {n} used OEM German auto body panels - {mix}. '
        'Model years approximately 2011-2016 across BMW, Mercedes-Benz and Audi. '
        '{assembly}'
        'Condition across the lot is {condition}. Sold as one lot, buyer removes. '
        'Lot is stored in New Castle County, Delaware and loads onto a box truck '
        'or trailer in a single trip.\n\n'
        'Independent appraisal: ${rl:,.0f}-${rh:,.0f} at individual retail, '
        '${wl:,.0f}-${wh:,.0f} as a wholesale lot.'
    ).format(
        n=result['total_panels'], mix=mix,
        assembly=('All {} doors are complete assemblies with glass, regulators, '
                  'latches and wiring. '.format(result['assembly_count'])
                  if result['assembly_count'] else ''),
        condition=result['condition'],
        rl=result['retail_total'][0], rh=result['retail_total'][1],
        wl=result['wholesale_total'][0], wh=result['wholesale_total'][1])

    with app.app_context():
        auction = Auction(
            title='{}-Piece German Auto Body Panel Lot (2011-2016 BMW / Mercedes / Audi)'
                  .format(result['total_panels']),
            description=description,
            shed_type='Auto Body Parts Lot',
            dimensions='{} panels'.format(result['total_panels']),
            location='New Castle County, DE',
            condition=result['condition'].title(),
            starting_price=start,
            reserve_price=reserve,
            bid_increment=250.0,
            current_price=start,
            image_url='',
            start_time=datetime.utcnow(),
            end_time=datetime.utcnow() + timedelta(days=args.days),
        )
        db.session.add(auction)
        db.session.commit()
        print('Created auction #{}: {}'.format(auction.id, auction.title))
        print('  Opening bid ${:,.0f} / reserve ${:,.0f} / ends {}'.format(
            start, reserve, auction.end_time.strftime('%Y-%m-%d %H:%M UTC')))
    return 0


def _add_valuation_args(parser):
    parser.add_argument('--fenders', type=int)
    parser.add_argument('--hoods', type=int)
    parser.add_argument('--doors', type=int)
    parser.add_argument('--assembly-share', type=float, default=1.0,
                        help='share of doors that are complete assemblies (0-1)')
    parser.add_argument('--condition', default='good',
                        choices=['excellent', 'good', 'fair', 'rough'])
    parser.add_argument('--demand', default='high_volume',
                        choices=['high_volume', 'premium', 'niche'])
    parser.add_argument('--paint-coded', action='store_true',
                        help='lot is sorted and labelled by paint code')
    parser.add_argument('--commission', type=float, default=0.15,
                        help="auction house seller's commission (0.15 = 15%%)")
    parser.add_argument('--logistics', type=float, default=0.0,
                        help='your out-of-pocket wrapping/loading/storage cost')


def build_parser():
    parser = argparse.ArgumentParser(
        prog='scraper.cli',
        description='Lead sourcing and lot valuation for the New Castle County '
                    'German body-panel liquidation.')
    sub = parser.add_subparsers(dest='command')

    scrape = sub.add_parser('scrape', help='find buyers and save them')
    scrape.add_argument('--sources', help='comma list: seed,overpass,places')
    scrape.add_argument('--radius', type=float, default=config.RADIUS_MILES)
    scrape.add_argument('--enrich', action='store_true',
                        help='visit lead websites to harvest emails (slow, robots-aware)')
    scrape.add_argument('--enrich-limit', type=int, default=40)
    scrape.add_argument('--dry-run', action='store_true')
    scrape.add_argument('--top', type=int, default=25)
    scrape.set_defaults(func=cmd_scrape)

    listing = sub.add_parser('list', help='show saved leads')
    listing.add_argument('--top', type=int, default=25)
    listing.add_argument('--category')
    listing.set_defaults(func=cmd_list)

    export = sub.add_parser('export', help='write leads to CSV')
    export.add_argument('path', nargs='?', help='output file (default stdout)')
    export.set_defaults(func=cmd_export)

    value = sub.add_parser('value', help='value the lot')
    _add_valuation_args(value)
    value.set_defaults(func=cmd_value)

    reach = sub.add_parser('outreach', help='print call script and email for a lead')
    reach.add_argument('lead_id', type=int)
    reach.add_argument('--seller-name', default='')
    reach.add_argument('--seller-phone', default='')
    reach.add_argument('--seller-email', default='')
    _add_valuation_args(reach)
    reach.set_defaults(func=cmd_outreach)

    lot = sub.add_parser('create-lot-auction',
                         help='list the parts lot as an auction on the site')
    lot.add_argument('--days', type=int, default=10, help='auction length in days')
    _add_valuation_args(lot)
    lot.set_defaults(func=cmd_create_lot_auction)

    return parser


def main(argv=None):
    parser = build_parser()
    args = parser.parse_args(argv)
    if not getattr(args, 'func', None):
        parser.print_help()
        return 1
    return args.func(args)


if __name__ == '__main__':
    sys.exit(main())
