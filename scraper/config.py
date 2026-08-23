"""Region, category and scoring configuration for the lead scraper.

Everything is anchored on New Castle County, Delaware. The default 100-mile
radius is deliberate: it is the distance a buyer will still send a box truck
for 150 body panels. Beyond that, freight eats the margin and the lead is
worth contacting only if it is a genuine specialist.
"""

import os

# ── Region ────────────────────────────────────────────────────────────────────
# Anchor: New Castle, DE (centre of gravity for the county's industrial belt
# along US-13 / I-495, and where the lot physically sits).
ANCHOR_NAME = 'New Castle, DE'
ANCHOR_LAT = 39.6620
ANCHOR_LON = -75.5663

# Search radius in miles. 100 mi reaches Philadelphia, Baltimore, South Jersey,
# Lancaster PA, Cecil County MD and the Hunterdon County NJ euro yards.
RADIUS_MILES = float(os.environ.get('SCRAPE_RADIUS_MILES', 100))

# Distance bands used for scoring and for the "how do we move it" decision.
BAND_LOCAL = 25       # buyer can come with a trailer the same day
BAND_REGIONAL = 60    # one round trip in a day
BAND_EXTENDED = 100   # worth a dedicated run for the whole lot
BAND_FREIGHT = 250    # LTL freight territory - specialists only


# ── Categories ────────────────────────────────────────────────────────────────
# weight = how valuable this kind of business is as a buyer for a 150-piece
# lot of 2011-2016 German body panels (doors, hoods, fenders).
CATEGORIES = {
    'euro_recycler': {
        'label': 'Specialist German/Euro recycler',
        'weight': 40,
        'why': 'Highest probability of a one-time bulk buyout. They already '
               'stock these exact panels and have the space.',
    },
    'salvage_yard': {
        'label': 'Auto recycler / salvage yard',
        'weight': 30,
        'why': 'Buys bulk batches to refresh inventory. Will lowball, but '
               'takes the whole lot in one transaction.',
    },
    'dismantler': {
        'label': 'Dismantler / parts exporter',
        'weight': 30,
        'why': 'Moves volume online; will cherry-pick high-demand panels and '
               'sometimes take the remainder at scrap-plus pricing.',
    },
    'collision_euro': {
        'label': 'European specialist collision / repair shop',
        'weight': 25,
        'why': 'Pays more per panel than a yard because used OEM beats new '
               'factory pricing on their estimates. Buys in ones and twos.',
    },
    'collision': {
        'label': 'Independent collision repair shop',
        'weight': 15,
        'why': 'Retail-adjacent pricing on the panels that match their work '
               'mix. Volume is low but margin is the best available.',
    },
    'salvage_auction': {
        'label': 'Salvage pool / insurance auction',
        'weight': 20,
        'why': 'Their buyers are rebuilders - the exact people who need clean '
               'used panels. Good for referrals and for a consignment lane.',
    },
    'liquidator': {
        'label': 'Commercial liquidator / industrial auctioneer',
        'weight': 20,
        'why': 'Handles the hands-off exit: catalogues the lot, runs the '
               'online auction, takes 10-20% seller commission.',
    },
    'appraiser': {
        'label': 'Machinery & technical asset appraiser',
        'weight': 15,
        'why': 'Needed if a certified valuation is required for legal, estate '
               'or insurance purposes before the sale.',
    },
    'parts_store': {
        'label': 'Used parts retailer / counter',
        'weight': 10,
        'why': 'Occasional buyer, useful for filling gaps and for referrals.',
    },
    'scrap': {
        'label': 'Scrap metal / recycling centre',
        'weight': 5,
        'why': 'The floor price. Only relevant for panels nobody wants.',
    },
    'unknown': {'label': 'Uncategorised', 'weight': 5, 'why': ''},
}

# ── Keyword signals ───────────────────────────────────────────────────────────
GERMAN_BRANDS = (
    'bmw', 'mercedes', 'benz', 'audi', 'volkswagen', ' vw ', 'porsche', 'mini',
    'german', 'bavarian', 'euro', 'autohaus', 'autohaz', 'motorwerks', 'werks',
)

CATEGORY_KEYWORDS = (
    # (category, keywords) - evaluated in order, first match wins.
    ('euro_recycler', ('german auto', 'euro parts', 'european auto recycl',
                       'bavarian', 'recycle bmw', 'german recycl',
                       'euro used parts', 'german used')),
    ('salvage_auction', ('copart', 'iaa', 'insurance auto auction',
                         'salvage auction', 'manheim')),
    ('liquidator', ('liquidat', 'auctioneer', 'auction service',
                    'estate sale', 'asset recovery')),
    ('appraiser', ('appraisal', 'appraiser', 'valuation service')),
    ('salvage_yard', ('salvage', 'junk yard', 'junkyard', 'auto recycl',
                      'pick your part', 'u-pull', 'pull-a-part', 'lkq')),
    ('dismantler', ('dismantl', 'part out', 'parting out', 'auto wreck')),
    ('collision_euro', ('collision', 'auto body', 'body shop', 'body works')),
    ('collision', ('collision', 'auto body', 'body shop')),
    ('scrap', ('scrap metal', 'metal recycl', 'emr ', 'shredder')),
    ('parts_store', ('auto parts', 'used parts', 'parts supply')),
)


# ── OpenStreetMap / Overpass tag queries ──────────────────────────────────────
# Each entry: (osm filter, default category). `nwr` = node/way/relation.
OSM_FILTERS = [
    ('["shop"="car_parts"]', 'parts_store'),
    ('["shop"="car_repair"]', 'collision'),
    ('["craft"="car_repair"]', 'collision'),
    ('["shop"="car_repair"]["service:vehicle:body_repair"="yes"]', 'collision'),
    ('["industrial"="scrap_yard"]', 'scrap'),
    ('["amenity"="scrap_yard"]', 'scrap'),
    ('["shop"="auction_house"]', 'liquidator'),
    ('["office"="auctioneer"]', 'liquidator'),
    ('["landuse"="industrial"]["name"~"salvage|junk|recycl|auto part",i]', 'salvage_yard'),
]

OVERPASS_ENDPOINTS = [
    os.environ.get('OVERPASS_URL', 'https://overpass-api.de/api/interpreter'),
    'https://overpass.kumi.systems/api/interpreter',
    'https://overpass.osm.ch/api/interpreter',
]

USER_AGENT = os.environ.get(
    'SCRAPER_USER_AGENT',
    'AuctionGeraLeadBot/1.0 (+https://auctiongera.com; parts-lot liquidation research)'
)

# Politeness: seconds between requests to the same host during enrichment.
REQUEST_DELAY_SECONDS = float(os.environ.get('SCRAPE_DELAY', 1.5))
REQUEST_TIMEOUT = 20

# Optional paid source - skipped entirely when the key is absent.
GOOGLE_PLACES_API_KEY = os.environ.get('GOOGLE_PLACES_API_KEY', '')

GOOGLE_PLACES_QUERIES = [
    'German auto parts recycler',
    'European auto salvage yard',
    'used auto parts BMW Mercedes Audi',
    'auto salvage yard',
    'auto dismantler',
    'European auto repair specialist',
    'collision repair center',
    'commercial liquidation auctioneer',
    'machinery and equipment appraiser',
]
