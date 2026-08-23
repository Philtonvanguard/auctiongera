"""Distance helpers. No dependencies - great-circle maths only."""

import math

from . import config

EARTH_RADIUS_MILES = 3958.7613


def haversine_miles(lat1, lon1, lat2, lon2):
    """Great-circle distance in miles between two WGS84 points."""
    if None in (lat1, lon1, lat2, lon2):
        return None
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * EARTH_RADIUS_MILES * math.asin(min(1.0, math.sqrt(a)))


def distance_from_anchor(lat, lon):
    """Miles from the lot's location in New Castle County."""
    return haversine_miles(config.ANCHOR_LAT, config.ANCHOR_LON, lat, lon)


def band(distance_miles):
    """Human label for how the lot would physically reach this buyer."""
    if distance_miles is None:
        return 'unknown'
    if distance_miles <= config.BAND_LOCAL:
        return 'local'
    if distance_miles <= config.BAND_REGIONAL:
        return 'regional'
    if distance_miles <= config.BAND_EXTENDED:
        return 'extended'
    if distance_miles <= config.BAND_FREIGHT:
        return 'freight'
    return 'distant'
