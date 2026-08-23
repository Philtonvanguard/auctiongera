# AuctionGera

Flask auction site (sheds, structures and one-off asset lots) plus the lead
sourcing and valuation tooling for the New Castle County, DE German auto body
parts liquidation.

## Run it

```bash
pip install -r requirements.txt
python run.py            # http://localhost:5000 — admin / admin123
```

Production runs on gunicorn (`Procfile`), Postgres via `DATABASE_URL`, and
falls back to local SQLite when that is unset.

## Parts-lot tooling

| Path | What it is |
| --- | --- |
| `scraper/` | Finds buyers around New Castle County: OpenStreetMap (free), optional Google Places, a hand-verified seed list, and a robots-aware website email enricher. |
| `data/seed_leads.json` | 24 researched businesses — euro recyclers, salvage yards, body shops, liquidators — with contact details and confidence flags. |
| `valuation.py` | The appraisal's pricing table as a live model: mix, condition, demand, assembly premium, and net across three exit routes. |
| `outreach.py` | Call scripts and email drafts, one pitch per buyer type. |
| `docs/PARTS_LOT_PLAYBOOK.md` | **Start here** — strategy, targets, numbers and commands. |

```bash
python -m scraper.cli scrape        # find and save buyers
python -m scraper.cli value         # what the lot is worth
python -m scraper.cli outreach 1    # script + email for lead #1
```

In the browser: **Admin → Buyer leads** and **Admin → Lot valuation**.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `SECRET_KEY`, `DATABASE_URL` | Flask / database |
| `TAWK_PROPERTY_ID`, `TAWK_WIDGET_ID` | chat widget (renders only when both set) |
| `N8N_BID_WEBHOOK`, `N8N_PAYMENT_WEBHOOK` | bid / payment notifications |
| `GOOGLE_PLACES_API_KEY` | optional lead source; skipped when unset |
| `SCRAPE_RADIUS_MILES`, `SCRAPE_DELAY`, `OVERPASS_URL` | scraper tuning |
