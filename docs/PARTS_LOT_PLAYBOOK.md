# New Castle County Parts-Lot Playbook

How to liquidate a 150-piece lot of 2011–2016 German auto body panels (doors,
hoods, fenders) sitting in New Castle County, Delaware — and the tooling in
this repo that supports it.

The strategy comes from the appraisal document. This adds the part that
document could not: a working list of the actual businesses in and around New
Castle County that will take the lot, and the numbers re-derived on demand
instead of frozen in a PDF.

---

## 1. Run it

```bash
pip install -r requirements.txt

# Find buyers. Writes to the Lead table. Safe to re-run - it never
# overwrites your own status, notes or offer amounts.
python -m scraper.cli scrape

# Look at what you got, work it top-down.
python -m scraper.cli list --top 25
python -m scraper.cli export leads.csv

# What the lot is worth, under whatever assumptions you want to test.
python -m scraper.cli value --condition good --assembly-share 1.0

# Call script + email draft for a specific lead.
python -m scraper.cli outreach 1 --seller-name "Your Name" --seller-phone "302-555-0100"

# List the lot as an auction on the AuctionGera site itself.
python -m scraper.cli create-lot-auction --days 10
```

In the browser, logged in as an admin: **Admin → Buyer leads** and
**Admin → Lot valuation**. The leads page can trigger a scrape and shows the
log live.

---

## 2. Where the leads come from

| Source | Key needed | What it gives you |
| --- | --- | --- |
| `seed` | no | 24 hand-researched businesses in `data/seed_leads.json`, checked against public listings on 2026-08-23 |
| `overpass` | no | OpenStreetMap POIs within the radius — car parts shops, repair shops, scrap yards, auction houses. Free, keyless, no scraping-terms problem. Data is ODbL. |
| `places` | `GOOGLE_PLACES_API_KEY` | Google Places text search. Optional, costs money, but it carries phone numbers for the independent body shops OSM misses. |
| `--enrich` | no | Visits each lead's own website looking for a contact email. Obeys `robots.txt`, identifies itself, rate-limits per host, touches at most 8 pages per site. Slow — run it once after a scrape. |

Overpass is the primary source deliberately: querying it is free and
explicitly permitted, which is not true of scraping Yelp, Google Maps result
pages, or directory sites. If Overpass is unreachable from wherever you run
this, the pipeline logs it and carries on with the other sources.

### Scoring

Every lead gets 0–100:

- **up to 40 — category fit.** A specialist German recycler is the whole game;
  a scrap yard is the floor price.
- **up to 20 — German signal.** Their name, site or description mentions BMW,
  Mercedes, Audi, VW, Porsche, "German", "Euro", "Bavarian".
- **up to 20 — proximity.** 150 fragile panels is a freight problem. Local
  (≤25 mi) beats a better price 400 miles away. Past ~250 mi the lead is
  penalised: keep it as a price reference, not a buyer.
- **up to 20 — contactability.** A lead you cannot phone is not a lead.

Work the list top-down. The top of the list should be euro recyclers with a
phone number inside 100 miles.

---

## 3. The four plays, in the order to try them

### Play 1 — Specialist German recyclers (fastest exit)

Highest probability of one call, one truck, one cheque. They already stock
these exact panels, they have the space, and they buy batches to refresh
inventory.

Confirmed targets in range:

| Business | Where | Distance | Contact |
| --- | --- | --- | --- |
| German Auto Resort LLC | Stockton, NJ | ~60 mi | (908) 996-1009 · germanautoresort@hotmail.com |
| LKQ Potomac German Auto Parts | Halethorpe, MD | ~66 mi | (800) 831-7686 |
| Euro Parts | Clarksville, MD | ~80 mi | (888) 705-0050 · europarts7451@outlook.com |
| HM Auto Parts & Recycling | West Grove, PA | ~18 mi | hmsellsautoparts.com — already sells into Bear/Newark/New Castle |

Get LKQ's number in writing first. It will be the lowest, and it becomes the
floor you hold every independent to.

### Play 2 — Local yards (zero transport cost)

Shuster's Auto Salvage (Wilmington, ~4 mi, 302-658-6409), Delaware Auto
Salvage (New Castle, 302-328-1091), B&F Towing (New Castle — owns its own
trucks). Their offers will be lower per panel, but they collect for free and
pay immediately. Net out the freight before you dismiss them.

### Play 3 — Independent European specialty shops (best margin, slowest)

Shops pay closer to retail because a used OEM panel undercuts the new factory
part on their estimate. They buy in ones and twos, so this is a way to skim
the high-value panels, not to clear the lot. Euro-Tech (Wilmington), German
Auto Werks (New Castle), Pinter Autohaz (Audi/VW), Eurocar, Performance Auto
Specialists, Ewing Auto Repair (Newark).

Offer a steep discount if a shop takes a mini-bulk package of one generation —
"ten 2012–2015 BMW F30 3-Series front doors, clean."

### Play 4 — Commercial liquidation (hands-off)

Delaware Estate Sales and Auctions (Wilmington) locally; AJ Willner Auctions
(NJ) regionally. Expect 10–20% seller's commission. They catalogue,
photograph, market to their buyer list and run the auction. You still pay to
wrap and load.

Do **not** sell to Copart or IAA New Castle — their registered buyers are
rebuilders, the exact people who need clean used panels. Ask the branch for
the heavy local buyers instead.

### If a certified appraisal is required

For legal, estate or insurance purposes you need a certified appraiser, not a
consumer auto appraiser. Look for **ASA** certification in *Machinery and
Technical Specialties (MTS)* via the American Society of Appraisers directory,
or the International Automotive Appraisers Association (I-AAA). Neither is in
the seed list because neither has a New Castle County office worth naming —
search their directories directly.

---

## 4. The numbers

`valuation.py` implements the appraisal's table. Per panel:

| Part type | Individual retail | Bulk wholesale (20–30% of retail) |
| --- | --- | --- |
| Fender | $175 – $350 | $40 – $80 |
| Hood | $350 – $600 | $80 – $150 |
| Door (bare shell) | $300 – $500 | $70 – $120 |
| Door (full assembly) | $500 – $800 | $120 – $200 |

At the appraisal's default mix — 50 fenders, 40 hoods, 60 doors, all doors as
complete assemblies, good condition:

```
  Fenders            x50    wholesale  $2,000 – $4,000
  Hoods              x40    wholesale  $3,200 – $6,000
  Doors (bare)       x60    wholesale  $4,200 – $7,200
  Door assemblies    x60    premium    $3,000 – $4,800
  ────────────────────────────────────────────────────
  Retail, one at a time            $52,750 – $89,500
  Wholesale lot value              $12,400 – $22,000

  Direct bulk buyout        net  $12,400 – $22,000   (days)
  Liquidation auction @15%  net  $11,067 – $19,635   (4–8 weeks)
  Piecemeal retail          net  $25,286 – $44,469   (12–18 months)
```

Two things to notice.

**The appraisal's headline range of $15,000–$25,000 is rounded up** from its
own line items, which add to $12,400–$22,000. Plan against the computed
number. Treat $15K as an optimistic case, not a floor.

**Piecemeal retail always shows the biggest number**, and it is the reason
people sit on inventory for two years. It assumes 60% sell-through, 13%
marketplace fees and $25/panel in handling — and that you personally store,
photograph, list, pack and freight 150 fragile panels. A direct bulk buyout
nets roughly what an auction does without the commission or the wait.

### What moves the number

- **Full assemblies vs. bare shells.** Glass, regulators, latches and wiring
  are worth $3,000–$4,800 across 60 doors on their own. Record it per door.
- **Paint codes.** A lot sorted and labelled by paint code (Jet Black 668 vs.
  Black Sapphire Metallic 475) buys the buyer less risk and is worth ~5%.
- **Aluminium vs. steel.** BMW 5-Series F10 and Audi A6 C7 hoods and fenders
  are aluminium — higher price points, but harder to repair once dented, so
  condition matters more on those.
- **Model demand.** High-volume cars (BMW F30 3-Series, Mercedes W204
  C-Class) flip fast. Niche models sit and get discounted ~15%.
- **Condition.** The multiplier runs 1.15 (excellent) to 0.40 (creased,
  rusted, holed — scrap-plus money only).

### Suggested listing terms

Opening bid $7,400, reserve $12,400 (the low end of wholesale). Below the
reserve, a direct buyout beats running an auction at all.
`python -m scraper.cli create-lot-auction` creates exactly that listing on the
site.

---

## 5. Prep before you contact anyone

1. **Inventory everything.** Year, make, model, part, part number, paint code,
   condition, and — for doors — assembly or bare shell.
2. **Photograph it.** Clear pictures of stampings, part numbers and paint
   codes. For body panels, buyers will not quote without them.
3. **Sort and stack by paint code.** It is the cheapest thing you can do to
   raise the offer.
4. **Check licensing.** Delaware regulates the sale of used auto components;
   confirm what New Castle County requires of you before selling at volume.
5. **Then call.** `python -m scraper.cli outreach <lead_id>` prints the right
   script for that category and a matching email you can paste.

---

## 6. Data hygiene

Phone numbers and addresses in `data/seed_leads.json` came from public
business listings and the businesses' own sites in August 2026. Each record
carries a `confidence` field (`full` / `partial` / `name_only`). Confirm
details on the call — directory data goes stale, and a wrong number wastes a
lead, not just a minute.

If you republish anything derived from the `overpass` source, attribute
OpenStreetMap contributors (ODbL).
