"""Valuation model for the 150-piece German body-panel lot.

The numbers below come straight out of the appraisal your landlord had
prepared (2011-2016 German makes - doors, hoods, fenders). This module turns
that static table into something you can re-run when the mix, the condition
or the sales channel changes.

Base table (per panel, USD):

    part type            individual retail    bulk wholesale (20-30% of retail)
    fender               175 - 350             40 -  80
    hood                 350 - 600             80 - 150
    door (bare shell)    300 - 500             70 - 120
    door (full assembly) 500 - 800            120 - 200

"Full assembly" means the door still carries its glass, regulator, latch,
wiring and lock. The premium is the delta over a bare shell, and on a 60-door
lot it is worth roughly $3,000-$5,000 on its own - which is why the prep
checklist insists on recording it.
"""

PART_TYPES = {
    'fender': {
        'label': 'Fenders',
        'retail': (175, 350),
        'bulk': (40, 80),
        'default_count': 50,
    },
    'hood': {
        'label': 'Hoods',
        'retail': (350, 600),
        'bulk': (80, 150),
        'default_count': 40,
    },
    'door': {
        'label': 'Doors (bare shell)',
        'retail': (300, 500),
        'bulk': (70, 120),
        'default_count': 60,
    },
}

# Full-assembly door pricing - applied as a premium on top of the bare price.
DOOR_ASSEMBLY = {'retail': (500, 800), 'bulk': (120, 200)}

CONDITION_FACTORS = {
    'excellent': (1.15, 'Straight, no rust, original paint, no prior repair'),
    'good':      (1.00, 'Minor scuffs, straight, ready to prep and paint'),
    'fair':      (0.75, 'Dings or small dents, needs bodywork before paint'),
    'rough':     (0.40, 'Creased, rusted or holed - scrap-plus money only'),
}

DEMAND_FACTORS = {
    'high_volume': (1.00, 'BMW 3-Series F30, Mercedes C-Class W204 - yards flip these fast'),
    'premium':     (1.10, 'BMW 5-Series F10, Audi A6 C7 - aluminium panels, higher price points'),
    'niche':       (0.85, 'Low-production or niche models - sit on the shelf, discounted hard'),
}

# Channel assumptions.
AUCTION_COMMISSION = (0.10, 0.20)   # seller's commission at a liquidation house
AUCTION_REACH = 1.05                # competitive bidding lifts a good catalogue
EBAY_FEE_RATE = 0.13                # marketplace final-value fee
PIECEMEAL_SELL_THROUGH = 0.60       # share of 150 panels that actually sell
PIECEMEAL_HANDLING_PER_PANEL = 25   # packing, labour and freight admin
PAINT_CODE_BONUS = 0.05             # a sorted, paint-coded lot buys less risk

DEFAULT_MIX = {'fender': 50, 'hood': 40, 'door': 60}


def _factor(counts, condition, demand, paint_coded):
    multiplier = CONDITION_FACTORS.get(condition, CONDITION_FACTORS['good'])[0]
    multiplier *= DEMAND_FACTORS.get(demand, DEMAND_FACTORS['high_volume'])[0]
    if paint_coded:
        multiplier *= (1 + PAINT_CODE_BONUS)
    return multiplier


def value_lot(counts=None, assembly_share=1.0, condition='good',
              demand='high_volume', paint_coded=False,
              commission_rate=0.15, logistics_cost=0.0):
    """Value the lot across all three exit routes.

    counts          panels by type, e.g. {'fender': 50, 'hood': 40, 'door': 60}
    assembly_share  0-1, share of doors sold as complete assemblies
    condition       one of CONDITION_FACTORS
    demand          one of DEMAND_FACTORS
    paint_coded     True when the lot is sorted and labelled by paint code
    commission_rate seller's commission if going through an auction house
    logistics_cost  your out-of-pocket for wrapping, loading and storage
    """
    counts = dict(DEFAULT_MIX if counts is None else counts)
    assembly_share = max(0.0, min(1.0, float(assembly_share)))
    multiplier = _factor(counts, condition, demand, paint_coded)

    lines = []
    retail_low = retail_high = bulk_low = bulk_high = 0.0

    for key, spec in PART_TYPES.items():
        count = int(counts.get(key, 0) or 0)
        if count <= 0:
            continue
        r_low, r_high = spec['retail']
        b_low, b_high = spec['bulk']
        line = {
            'key': key,
            'label': spec['label'],
            'count': count,
            'retail_unit': (r_low, r_high),
            'bulk_unit': (b_low, b_high),
            'retail_total': (count * r_low * multiplier, count * r_high * multiplier),
            'bulk_total': (count * b_low * multiplier, count * b_high * multiplier),
        }
        lines.append(line)
        retail_low += line['retail_total'][0]
        retail_high += line['retail_total'][1]
        bulk_low += line['bulk_total'][0]
        bulk_high += line['bulk_total'][1]

    # Full-assembly premium: the delta over a bare shell, on the doors that
    # still carry glass, regulators, latches and wiring.
    door_count = int(counts.get('door', 0) or 0)
    assembly_count = int(round(door_count * assembly_share))
    premium_low = premium_high = 0.0
    if assembly_count:
        bare_low, bare_high = PART_TYPES['door']['bulk']
        asm_low, asm_high = DOOR_ASSEMBLY['bulk']
        premium_low = assembly_count * (asm_low - bare_low) * multiplier
        premium_high = assembly_count * (asm_high - bare_high) * multiplier
        r_bare_low, r_bare_high = PART_TYPES['door']['retail']
        r_asm_low, r_asm_high = DOOR_ASSEMBLY['retail']
        retail_low += assembly_count * (r_asm_low - r_bare_low) * multiplier
        retail_high += assembly_count * (r_asm_high - r_bare_high) * multiplier
        bulk_low += premium_low
        bulk_high += premium_high

    total_panels = sum(int(counts.get(k, 0) or 0) for k in PART_TYPES)

    # ── Channel 1: direct bulk buyout by a recycler. No fees, buyer collects.
    buyout = (bulk_low, bulk_high)

    # ── Channel 2: commercial liquidation auction.
    hammer_low = bulk_low * AUCTION_REACH
    hammer_high = bulk_high * AUCTION_REACH
    commission_rate = max(0.0, min(0.5, float(commission_rate)))
    auction_net = (hammer_low * (1 - commission_rate) - logistics_cost,
                   hammer_high * (1 - commission_rate) - logistics_cost)

    # ── Channel 3: piecemeal retail. The best headline, the worst reality.
    sold = total_panels * PIECEMEAL_SELL_THROUGH
    share = (sold / total_panels) if total_panels else 0
    piece_gross = (retail_low * share, retail_high * share)
    handling = sold * PIECEMEAL_HANDLING_PER_PANEL
    piecemeal_net = (piece_gross[0] * (1 - EBAY_FEE_RATE) - handling - logistics_cost,
                     piece_gross[1] * (1 - EBAY_FEE_RATE) - handling - logistics_cost)

    return {
        'lines': lines,
        'total_panels': total_panels,
        'assembly_count': assembly_count,
        'multiplier': round(multiplier, 3),
        'condition': condition,
        'demand': demand,
        'paint_coded': bool(paint_coded),
        'commission_rate': commission_rate,
        'logistics_cost': logistics_cost,
        'assembly_premium': (premium_low, premium_high),
        'retail_total': (retail_low, retail_high),
        'wholesale_total': (bulk_low, bulk_high),
        'channels': {
            'bulk_buyout': {
                'label': 'Direct bulk buyout (specialist recycler)',
                'gross': buyout,
                'net': (buyout[0] - logistics_cost, buyout[1] - logistics_cost),
                'speed': 'Days',
                'note': 'One transaction, buyer collects, no commission. Lowest '
                        'headline number and the highest certainty.',
            },
            'liquidation_auction': {
                'label': 'Commercial liquidation auction',
                'gross': (hammer_low, hammer_high),
                'net': auction_net,
                'speed': '4-8 weeks',
                'note': 'Auction house catalogues and markets the lot, then takes '
                        '{:.0f}% commission. You still pay to wrap and load.'
                        .format(commission_rate * 100),
            },
            'retail_piecemeal': {
                'label': 'Piecemeal retail (eBay / Facebook / counter sales)',
                'gross': piece_gross,
                'net': piecemeal_net,
                'speed': '12-18 months',
                'note': 'Assumes {:.0f}% sell-through, {:.0f}% marketplace fees and '
                        '${:.0f}/panel handling. Highest number, and it needs storage, '
                        'packing and freight for every fragile panel.'
                        .format(PIECEMEAL_SELL_THROUGH * 100, EBAY_FEE_RATE * 100,
                                PIECEMEAL_HANDLING_PER_PANEL),
            },
        },
    }


def recommended_reserve(result):
    """A defensible reserve for listing the lot: the low end of the wholesale
    range. Below this, a direct buyout beats running an auction at all."""
    return round(result['wholesale_total'][0], -2)


def recommended_start(result):
    """Opening bid - deliberately under the reserve to draw bidders in."""
    return round(result['wholesale_total'][0] * 0.6, -2)


def summary_lines(result):
    """Plain-text summary, used by the CLI and the outreach templates."""
    money = lambda pair: '${:,.0f} - ${:,.0f}'.format(pair[0], pair[1])   # noqa: E731
    out = ['{} panels, condition "{}", demand "{}"{}'.format(
        result['total_panels'], result['condition'], result['demand'],
        ', paint-coded' if result['paint_coded'] else '')]
    for line in result['lines']:
        out.append('  {:<20} x{:<4} wholesale {}'.format(
            line['label'], line['count'], money(line['bulk_total'])))
    if result['assembly_count']:
        out.append('  {:<20} x{:<4} premium   {}'.format(
            'Door assemblies', result['assembly_count'],
            money(result['assembly_premium'])))
    out.append('')
    out.append('  Retail if sold one at a time : {}'.format(money(result['retail_total'])))
    out.append('  Wholesale lot value          : {}'.format(money(result['wholesale_total'])))
    out.append('')
    for channel in result['channels'].values():
        out.append('  {:<42} net {}  ({})'.format(
            channel['label'], money(channel['net']), channel['speed']))
    return '\n'.join(out)
