"""OpenStreetMap Overpass API source.

Overpass is the right primary source here: no API key, no per-request cost,
no terms-of-service problem with automated querying, and it returns exactly
the fields outreach needs (name, address, phone, website, coordinates).
Data is ODbL - attribute OpenStreetMap contributors if you republish it.
"""

import time

import requests

from .. import config

_QUERY_TEMPLATE = """[out:json][timeout:{timeout}];
(
{clauses}
);
out center tags;"""


def _build_query(radius_miles, filters):
    radius_m = int(radius_miles * 1609.344)
    clauses = '\n'.join(
        '  nwr{f}(around:{r},{lat},{lon});'.format(
            f=osm_filter, r=radius_m,
            lat=config.ANCHOR_LAT, lon=config.ANCHOR_LON)
        for osm_filter, _ in filters
    )
    return _QUERY_TEMPLATE.format(timeout=180, clauses=clauses)


def _hint_for(tags):
    """Map OSM tags back to one of our category hints."""
    if tags.get('shop') == 'car_parts':
        return 'parts_store'
    if tags.get('shop') == 'car_repair' or tags.get('craft') == 'car_repair':
        return 'collision'
    if tags.get('industrial') == 'scrap_yard' or tags.get('amenity') == 'scrap_yard':
        return 'scrap'
    if tags.get('shop') == 'auction_house' or tags.get('office') == 'auctioneer':
        return 'liquidator'
    return 'unknown'


def _element_to_lead(element):
    tags = element.get('tags') or {}
    name = tags.get('name') or tags.get('operator')
    if not name:
        return None

    lat = element.get('lat') or (element.get('center') or {}).get('lat')
    lon = element.get('lon') or (element.get('center') or {}).get('lon')

    street = ' '.join(x for x in (tags.get('addr:housenumber'),
                                  tags.get('addr:street')) if x) or None

    descriptive = [tags.get(k) for k in
                   ('description', 'brand', 'operator', 'service:vehicle:body_repair')]
    tag_words = [v for k, v in tags.items()
                 if k in ('shop', 'craft', 'industrial', 'office', 'amenity',
                          'brand', 'operator', 'description')]

    return {
        'source': 'openstreetmap',
        'source_id': '{}/{}'.format(element.get('type'), element.get('id')),
        'name': name,
        'address': street,
        'city': tags.get('addr:city'),
        'state': tags.get('addr:state'),
        'postcode': tags.get('addr:postcode'),
        'phone': tags.get('phone') or tags.get('contact:phone'),
        'email': tags.get('email') or tags.get('contact:email'),
        'website': tags.get('website') or tags.get('contact:website'),
        'latitude': lat,
        'longitude': lon,
        'description': '; '.join(x for x in descriptive if x) or None,
        'tags': tag_words,
        'category_hint': _hint_for(tags),
    }


def fetch(radius_miles=None, filters=None, log=print):
    """Return raw lead dicts for every matching POI around the anchor."""
    radius_miles = radius_miles or config.RADIUS_MILES
    filters = filters or config.OSM_FILTERS
    query = _build_query(radius_miles, filters)

    last_error = None
    for endpoint in config.OVERPASS_ENDPOINTS:
        try:
            log('  [overpass] querying {} ({} mi radius)'.format(endpoint, radius_miles))
            response = requests.post(
                endpoint, data={'data': query},
                headers={'User-Agent': config.USER_AGENT},
                timeout=190)
            response.raise_for_status()
            elements = response.json().get('elements', [])
            leads = [lead for lead in map(_element_to_lead, elements) if lead]
            log('  [overpass] {} elements -> {} named businesses'.format(
                len(elements), len(leads)))
            return leads
        except Exception as exc:                      # noqa: BLE001
            last_error = exc
            log('  [overpass] {} failed: {}'.format(endpoint, exc))
            time.sleep(2)

    log('  [overpass] all endpoints failed ({}). Continuing without OSM data.'
        .format(last_error))
    return []
