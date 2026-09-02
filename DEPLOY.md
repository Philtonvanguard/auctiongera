# AuctionGera deployment

Two hosts, one domain.

| Half | Host | Serves |
|---|---|---|
| Marketing site (`web/`) | Cloudflare Pages | `/`, `/lots`, `/the-barn`, `/how-it-works`, `/contact` |
| Auction engine (`app.py`) | Render | `/auction/*`, `/login`, `/register`, `/admin/*`, `/terms`, `/privacy`, `/opt-out`, `/api/lots` |

Cloudflare is the front door. `web/functions/_middleware.ts` proxies the Render
paths, so both halves share one origin and the login cookie works everywhere.

## 1. Render (the auction engine)

Apply `render.yaml`, or set these on the existing `auctiongera` service by hand.

**Move the service off the Free plan to Starter.** On Free, Render spins the
service down after 15 minutes idle and takes about a minute to wake. A bidder
who clicks through during a closing auction will not wait that long. The
database is already on a paid plan (`basic_256mb`), so this is the only
remaining free component.

Environment variables:

| Key | Notes |
|---|---|
| `SECRET_KEY` | Already set. Rotate it: `python -c "import secrets; print(secrets.token_hex(32))"` |
| `DATABASE_URL` | Already set, points at `Auctiongera DB` |
| `ADMIN_PASSWORD` | Only creates the first admin on an **empty** database. Does not change an existing admin's password. |
| `ADMIN_EMAIL` | Optional |
| `N8N_BID_WEBHOOK` | Bid notification email |
| `N8N_PAYMENT_WEBHOOK` | Firefly III transaction log |
| `TAWK_PROPERTY_ID` / `TAWK_WIDGET_ID` | Chat widget renders only when both are set |

## 2. Cloudflare Pages (the marketing site)

Create a Pages project from the same GitHub repo.

| Setting | Value |
|---|---|
| Root directory | `web` |
| Build command | `npm run build` |
| Output directory | `out` |

Environment variables:

| Key | Value |
|---|---|
| `FLASK_ORIGIN` | `https://auctiongera.onrender.com` (used at runtime by the proxy) |
| `AUCTION_API_URL` | `https://auctiongera.onrender.com` (used at build time to bake lots into the HTML) |
| `SITE_URL` | `https://auctiongera.bid`. Drives canonical URLs, OG tags, and the sitemap. |
| `N8N_CONTACT_WEBHOOK` | Contact form destination. Needs a **new** n8n workflow; the bid and payment webhooks will not fit this payload. |

## 3. Domain

The domain is **auctiongera.bid**.

Attach it to the **Pages** project, not to Render. Render stays on its
`.onrender.com` hostname and is only ever reached through the proxy, so it
needs no custom domain of its own.

In Cloudflare: Pages project > Custom domains > add `auctiongera.bid` and
`www.auctiongera.bid`. DNS records are created for you when the domain is on
the same Cloudflare account.

`SITE_URL` defaults to `https://auctiongera.bid` in code, so canonical URLs,
OG tags, and the sitemap are already correct even if the env var is unset.

## Rebuilds

Lot data is baked into the HTML at build time so crawlers see real content, then
refreshed in the browser on load so prices are live. Visitors always see current
prices. Search engines see whatever was true at the last build, so trigger a
Pages rebuild when a batch of lots goes up. A Cloudflare deploy hook called from
the admin flow would automate this.

## Checks

```bash
python test_security.py
```

Seven checks covering the credentials bootstrap, bid webhook accuracy, reserve
price privacy, the Postgres-safe analytics query, and the debug-host guard.
