"""Optional Google Places (New Places API) source.

Skipped entirely unless GOOGLE_PLACES_API_KEY is set. Worth enabling when you
want phone numbers and opening hours for shops that OpenStreetMap does not
carry - which is most independent body shops.
"""

import time

import requests

from .. import config

ENDPOINT = 'https://places.googleapis.com/v1/places:searchText'
FIELDS = ('places.id,places.displayName,places.formattedAddress,'
          'places.internationalPhoneNumber,places.websiteUri,places.location,'
          'places.primaryTypeDisplayName,places.types,places.businessStatus')


def _parse_address(formatted):
    """'123 Main St, New Castle, DE 19720, USA' -> street/city/state/zip."""
    if not formatted:
        return None, None, None, None
    parts = [p.strip() for p in formatted.split(',')]
    parts = [p for p in parts if p and p.upper() != 'USA']
    street = parts[0] if parts else None
    city = parts[1] if len(parts) > 1 else None
    state = postcode = None
    if len(parts) > 2:
        bits = parts[2].split()
        if bits:
            state = bits[0]
        if len(bits) > 1:
            postcode = bits[1]
    return street, city, state, postcode


def _place_to_lead(place, query):
    if place.get('businessStatus') == 'CLOSED_PERMANENTLY':
        return None
    name = (place.get('displayName') or {}).get('text')
    if not name:
        return None
    street, city, state, postcode = _parse_address(place.get('formattedAddress'))
    location = place.get('location') or {}
    return {
        'source': 'google_places',
        'source_id': place.get('id'),
        'name': name,
        'address': street,
        'city': city,
        'state': state,
        'postcode': postcode,
        'phone': place.get('internationalPhoneNumber'),
        'email': None,
        'website': place.get('websiteUri'),
        'latitude': location.get('latitude'),
        'longitude': location.get('longitude'),
        'description': (place.get('primaryTypeDisplayName') or {}).get('text'),
        'tags': (place.get('types') or []) + [query],
        'category_hint': 'unknown',
    }


def fetch(radius_miles=None, queries=None, log=print):
    key = config.GOOGLE_PLACES_API_KEY
    if not key:
        log('  [places] GOOGLE_PLACES_API_KEY not set - skipping (optional source)')
        return []

    radius_miles = radius_miles or config.RADIUS_MILES
    queries = queries or config.GOOGLE_PLACES_QUERIES
    radius_m = min(50000, int(radius_miles * 1609.344))   # API caps at 50 km
    leads = []

    for query in queries:
        body = {
            'textQuery': '{} near {}'.format(query, config.ANCHOR_NAME),
            'maxResultCount': 20,
            'locationBias': {'circle': {
                'center': {'latitude': config.ANCHOR_LAT,
                           'longitude': config.ANCHOR_LON},
                'radius': float(radius_m)}},
        }
        try:
            response = requests.post(
                ENDPOINT, json=body, timeout=config.REQUEST_TIMEOUT,
                headers={'X-Goog-Api-Key': key,
                         'X-Goog-FieldMask': FIELDS,
                         'User-Agent': config.USER_AGENT})
            response.raise_for_status()
            found = response.json().get('places', [])
            batch = [lead for lead in (_place_to_lead(p, query) for p in found) if lead]
            leads.extend(batch)
            log('  [places] "{}" -> {}'.format(query, len(batch)))
        except Exception as exc:                          # noqa: BLE001
            log('  [places] "{}" failed: {}'.format(query, exc))
        time.sleep(config.REQUEST_DELAY_SECONDS)

    return leads
