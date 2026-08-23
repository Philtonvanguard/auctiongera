"""Hand-verified seed leads shipped with the repo.

These were researched by hand rather than scraped, so they carry real names,
addresses and phone numbers for the businesses that matter most to this lot.
They give the pipeline a useful result on day one - and a floor if Overpass is
unreachable from wherever this runs.

Every record carries `verified_on` and `sources`. Phone numbers change: treat
them as a starting point and confirm on the call.
"""

import json
import os

DATA_FILE = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    'data', 'seed_leads.json')


def fetch(path=None, log=print):
    path = path or DATA_FILE
    if not os.path.exists(path):
        log('  [seed] {} not found - skipping'.format(path))
        return []
    with open(path, 'r', encoding='utf-8') as handle:
        payload = json.load(handle)
    leads = payload.get('leads', [])
    for lead in leads:
        lead.setdefault('source', 'seed')
        lead.setdefault('source_id', lead.get('name'))
    log('  [seed] {} hand-verified leads'.format(len(leads)))
    return leads
