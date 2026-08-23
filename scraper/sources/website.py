"""Website enrichment: pull a contact email off a lead's own site.

This is the part that actually crawls, so it behaves:
  * obeys robots.txt for our User-Agent,
  * identifies itself honestly,
  * rate-limits per host,
  * touches at most a handful of pages per site (home + likely contact pages),
  * never follows off-site links.

Disabled unless you pass --enrich, because it is the slow step.
"""

import re
import time
from urllib.parse import urljoin, urlparse
from urllib.robotparser import RobotFileParser

import requests

from .. import config

CONTACT_PATHS = ('', '/contact', '/contact-us', '/contact.html', '/about',
                 '/about-us', '/sell-your-car', '/we-buy-cars')

_EMAIL_RE = re.compile(
    r'[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,10}')
_SCRIPT_RE = re.compile(r'<(script|style)[^>]*>.*?</\1>', re.S | re.I)
_TAG_RE = re.compile(r'<[^>]+>')

# Emails that belong to platforms, not the business.
_JUNK_EMAIL = ('example.com', 'sentry.io', 'wixpress.com', 'godaddy.com',
               'squarespace.com', '.png', '.jpg', '.gif', '.webp', '.svg',
               'domain.com', 'yourdomain', 'email.com', 'wordpress')

_robots_cache = {}


def _allowed(url):
    """robots.txt check for our agent. Fail open only on a missing file."""
    parsed = urlparse(url)
    root = '{}://{}'.format(parsed.scheme, parsed.netloc)
    parser = _robots_cache.get(root)
    if parser is None:
        parser = RobotFileParser()
        parser.set_url(root + '/robots.txt')
        try:
            parser.read()
        except Exception:                                # noqa: BLE001
            parser = None                                # no robots.txt served
        _robots_cache[root] = parser
    if parser is None:
        return True
    return parser.can_fetch(config.USER_AGENT, url)


def _extract_emails(html):
    text = _TAG_RE.sub(' ', _SCRIPT_RE.sub(' ', html))
    found = []
    for candidate in _EMAIL_RE.findall(text) + _EMAIL_RE.findall(html):
        low = candidate.lower()
        if any(junk in low for junk in _JUNK_EMAIL):
            continue
        if low not in found:
            found.append(low)
    return found


def _best_email(emails, host):
    """Prefer an address on the business's own domain, then sales/info."""
    domain = host.lower().replace('www.', '')
    on_domain = [e for e in emails if e.endswith('@' + domain)]
    pool = on_domain or emails
    for prefix in ('sales@', 'info@', 'parts@', 'contact@', 'office@'):
        for email in pool:
            if email.startswith(prefix):
                return email
    return pool[0] if pool else None


def enrich(lead, session=None, log=print):
    """Fill in `email` from the lead's website. Returns True if it found one."""
    website = lead.get('website')
    if not website or lead.get('email'):
        return False
    if not website.startswith('http'):
        website = 'https://' + website

    session = session or requests.Session()
    session.headers.update({'User-Agent': config.USER_AGENT})
    host = urlparse(website).netloc
    emails = []

    for path in CONTACT_PATHS:
        url = urljoin(website, path) if path else website
        if not _allowed(url):
            log('    [web] robots.txt disallows {}'.format(url))
            continue
        try:
            response = session.get(url, timeout=config.REQUEST_TIMEOUT,
                                   allow_redirects=True)
            if response.status_code != 200 or 'html' not in \
                    response.headers.get('Content-Type', ''):
                continue
            emails.extend(e for e in _extract_emails(response.text)
                          if e not in emails)
        except Exception:                                # noqa: BLE001
            pass
        finally:
            time.sleep(config.REQUEST_DELAY_SECONDS)
        if emails:
            break

    email = _best_email(emails, host)
    if email:
        lead['email'] = email
        log('    [web] {} -> {}'.format(lead.get('name'), email))
        return True
    return False


def enrich_all(leads, limit=None, log=print):
    """Enrich the highest-scoring leads that have a website but no email."""
    targets = [l for l in leads if l.get('website') and not l.get('email')]
    targets.sort(key=lambda l: l.get('score', 0), reverse=True)
    if limit:
        targets = targets[:limit]
    log('  [web] enriching {} sites (robots-aware, {}s delay)'.format(
        len(targets), config.REQUEST_DELAY_SECONDS))

    session = requests.Session()
    found = 0
    for lead in targets:
        if enrich(lead, session=session, log=log):
            found += 1
    log('  [web] found {} email addresses'.format(found))
    return found
