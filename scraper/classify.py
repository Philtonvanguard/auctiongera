"""Categorise and score a raw business record as a buyer for the parts lot."""

import re

from . import config, geo


def _haystack(lead):
    parts = [
        lead.get('name') or '',
        lead.get('description') or '',
        lead.get('website') or '',
        ' '.join(lead.get('tags') or []),
    ]
    return ' ' + ' '.join(parts).lower() + ' '


def looks_german(lead):
    """True when the business signals it works on German makes."""
    hay = _haystack(lead)
    return any(brand in hay for brand in config.GERMAN_BRANDS)


def categorise(lead):
    """Pick the best category for a lead from its name/description/tags.

    Falls back to the source's own hint, then 'unknown'.
    """
    hint = (lead.get('category_hint') or '').strip()

    # Seed records were checked by hand - their category is authoritative.
    # Without this, "German Auto Werks" (a repair shop) matches the
    # euro_recycler keyword "german auto" and gets filed as a parts yard.
    if 'seed' in str(lead.get('source', '')) and hint in config.CATEGORIES:
        return hint

    hay = _haystack(lead)
    german = looks_german(lead)

    for category, keywords in config.CATEGORY_KEYWORDS:
        if not any(k in hay for k in keywords):
            continue
        # A body shop that advertises German makes is a materially better lead
        # than a generic one, so promote it.
        if category == 'collision' and german:
            return 'collision_euro'
        if category == 'collision_euro' and not german:
            return 'collision'
        # Generic yards that clearly specialise get promoted too.
        if category in ('salvage_yard', 'dismantler', 'parts_store') and german:
            return 'euro_recycler'
        return category

    if hint in config.CATEGORIES:
        return 'euro_recycler' if (german and hint in ('parts_store', 'salvage_yard')) else hint
    return 'unknown'


def score(lead):
    """0-100 priority score. Higher = call this one first.

    Weighting rationale (see docs/PARTS_LOT_PLAYBOOK.md):
      category fit   up to 40   - a specialist euro recycler is the whole game
      German signal  up to 20   - they already stock these exact panels
      proximity      up to 20   - 150 panels is a freight problem, not a box
      contactability up to 20   - a lead you cannot phone is not a lead
    """
    category = lead.get('category') or 'unknown'
    points = config.CATEGORIES.get(category, config.CATEGORIES['unknown'])['weight']

    if looks_german(lead):
        points += 20

    distance = lead.get('distance_miles')
    if distance is None:
        points += 4                       # unknown location, mild penalty
    elif distance <= config.BAND_LOCAL:
        points += 20
    elif distance <= config.BAND_REGIONAL:
        points += 14
    elif distance <= config.BAND_EXTENDED:
        points += 8
    elif distance <= config.BAND_FREIGHT:
        points += 3
    else:
        # Cross-country freight on 150 fragile panels eats the whole margin.
        # Keep the lead as a price reference, but never above a local buyer.
        points -= 15

    if lead.get('phone'):
        points += 8
    if lead.get('email'):
        points += 8
    if lead.get('website'):
        points += 4

    return max(0, min(100, int(round(points))))


# ── Normalisation ─────────────────────────────────────────────────────────────

_PHONE_RE = re.compile(r'(\+?1[\s.\-]?)?\(?(\d{3})\)?[\s.\-]?(\d{3})[\s.\-]?(\d{4})')
_WS_RE = re.compile(r'\s+')


def normalise_phone(raw):
    """Return a +1XXXXXXXXXX string, or None when it is not a US number."""
    if not raw:
        return None
    m = _PHONE_RE.search(str(raw))
    if not m:
        return None
    return '+1{}{}{}'.format(m.group(2), m.group(3), m.group(4))


def format_phone(e164):
    if not e164 or len(e164) != 12 or not e164.startswith('+1'):
        return e164 or ''
    d = e164[2:]
    return '({}) {}-{}'.format(d[0:3], d[3:6], d[6:10])


def clean(value, limit=None):
    if value is None:
        return None
    text = _WS_RE.sub(' ', str(value)).strip()
    if not text:
        return None
    return text[:limit] if limit else text


def dedupe_key(lead):
    """Two records are the same business if the phone matches, else if the
    normalised name + town match."""
    if lead.get('phone'):
        return 'p:' + lead['phone']
    name = re.sub(r'[^a-z0-9]', '', (lead.get('name') or '').lower())
    city = re.sub(r'[^a-z0-9]', '', (lead.get('city') or '').lower())
    return 'n:{}|{}'.format(name, city)


def finalise(lead):
    """Normalise, categorise, measure and score a raw record in place."""
    lead['name'] = clean(lead.get('name'), 200)
    lead['address'] = clean(lead.get('address'), 250)
    lead['city'] = clean(lead.get('city'), 100)
    lead['state'] = clean(lead.get('state'), 20)
    lead['postcode'] = clean(lead.get('postcode'), 20)
    lead['website'] = clean(lead.get('website'), 300)
    lead['email'] = clean(lead.get('email'), 200)
    lead['description'] = clean(lead.get('description'), 1000)
    lead['phone'] = normalise_phone(lead.get('phone'))

    if lead.get('latitude') is not None and lead.get('longitude') is not None:
        lead['distance_miles'] = geo.distance_from_anchor(
            lead['latitude'], lead['longitude'])
    lead.setdefault('distance_miles', None)
    if lead['distance_miles'] is not None:
        lead['distance_miles'] = round(lead['distance_miles'], 1)
    lead['distance_band'] = geo.band(lead['distance_miles'])

    lead['category'] = categorise(lead)
    lead['is_german_specialist'] = looks_german(lead)
    lead['score'] = score(lead)
    return lead
