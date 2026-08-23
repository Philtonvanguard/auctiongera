"""Run the sources, merge the results, and write them into the Lead table."""

from datetime import datetime

from . import classify, config
from .sources import overpass, places, seed, website

SOURCES = {
    'seed': seed.fetch,
    'overpass': overpass.fetch,
    'places': places.fetch,
}


def collect(sources=None, radius_miles=None, log=print):
    """Fetch from each source and return merged, scored, de-duplicated leads."""
    sources = sources or ['seed', 'overpass', 'places']
    radius_miles = radius_miles or config.RADIUS_MILES

    raw = []
    for name in sources:
        fetcher = SOURCES.get(name)
        if not fetcher:
            log('  [pipeline] unknown source "{}" - skipped'.format(name))
            continue
        log('  [pipeline] source: {}'.format(name))
        try:
            raw.extend(fetcher(log=log) if name == 'seed'
                       else fetcher(radius_miles=radius_miles, log=log))
        except Exception as exc:                          # noqa: BLE001
            log('  [pipeline] source {} failed: {}'.format(name, exc))

    log('  [pipeline] {} raw records'.format(len(raw)))
    return merge(raw, radius_miles=radius_miles, log=log)


def merge(raw, radius_miles=None, log=print):
    """Score, filter by radius, and collapse duplicates.

    Later sources fill gaps in earlier ones rather than replacing them, and
    seed records always win on conflict because they were checked by hand.
    """
    radius_miles = radius_miles or config.RADIUS_MILES
    merged = {}

    for record in raw:
        lead = classify.finalise(dict(record))
        if not lead.get('name'):
            continue
        # Keep out-of-radius records only when they are genuine specialists.
        distance = lead.get('distance_miles')
        if distance is not None and distance > radius_miles \
                and lead['category'] != 'euro_recycler':
            continue

        key = classify.dedupe_key(lead)
        existing = merged.get(key)
        if existing is None:
            merged[key] = lead
            continue

        primary, secondary = (existing, lead)
        if lead.get('source') == 'seed' and existing.get('source') != 'seed':
            primary, secondary = (lead, existing)

        for field in ('address', 'city', 'state', 'postcode', 'phone', 'email',
                      'website', 'latitude', 'longitude', 'description'):
            if not primary.get(field) and secondary.get(field):
                primary[field] = secondary[field]
        primary['source'] = '+'.join(sorted(
            set(str(primary.get('source')).split('+')) |
            set(str(secondary.get('source')).split('+'))))
        merged[key] = classify.finalise(primary)

    leads = sorted(merged.values(), key=lambda l: l['score'], reverse=True)
    log('  [pipeline] {} unique leads after merge'.format(len(leads)))
    return leads


def enrich(leads, limit=None, log=print):
    """Optional slow step: visit websites to harvest contact emails."""
    website.enrich_all(leads, limit=limit, log=log)
    for lead in leads:
        lead['score'] = classify.score(lead)
    return leads


def save(leads, app=None, db=None, Lead=None, log=print):
    """Upsert leads into the database. Never clobbers human-entered fields
    (status, notes, contacted_at) on a re-scrape."""
    if app is None or db is None or Lead is None:        # pragma: no cover
        from app import Lead as _Lead, app as _app, db as _db
        app, db, Lead = _app, _db, _Lead

    created = updated = 0
    with app.app_context():
        for lead in leads:
            existing = None
            if lead.get('phone'):
                existing = Lead.query.filter_by(phone=lead['phone']).first()
            if existing is None:
                existing = Lead.query.filter_by(
                    name=lead['name'], city=lead.get('city')).first()

            if existing is None:
                existing = Lead(name=lead['name'], status='new')
                db.session.add(existing)
                created += 1
            else:
                updated += 1

            for field in ('address', 'city', 'state', 'postcode', 'phone',
                          'email', 'website', 'description', 'category',
                          'source', 'source_id'):
                value = lead.get(field)
                if value:
                    setattr(existing, field, value)

            existing.latitude = lead.get('latitude')
            existing.longitude = lead.get('longitude')
            existing.distance_miles = lead.get('distance_miles')
            existing.distance_band = lead.get('distance_band')
            existing.is_german_specialist = bool(lead.get('is_german_specialist'))
            existing.score = lead.get('score') or 0
            existing.last_seen_at = datetime.utcnow()

        db.session.commit()

    log('  [pipeline] saved: {} new, {} updated'.format(created, updated))
    return created, updated


def run(sources=None, radius_miles=None, do_enrich=False, enrich_limit=40,
        persist=True, log=print):
    """Full run: collect -> (enrich) -> save."""
    log('AuctionGera lead scrape - anchor {} / {} mi'.format(
        config.ANCHOR_NAME, radius_miles or config.RADIUS_MILES))
    leads = collect(sources=sources, radius_miles=radius_miles, log=log)
    if do_enrich:
        enrich(leads, limit=enrich_limit, log=log)
        leads.sort(key=lambda l: l['score'], reverse=True)
    if persist:
        save(leads, log=log)
    return leads
