import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import Link from "next/link";
import AuthLink from "@/components/AuthLink";
import { BUSINESS } from "@/lib/business";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const playfair = Playfair_Display({
  subsets: ["latin"], weight: ["700", "800"], variable: "--font-playfair", display: "swap",
});

// Same default as robots.ts and sitemap.ts, so canonical URLs, the sitemap and
// the Organization entity below all name one origin.
const SITE = process.env.SITE_URL ?? "https://auctiongera.bid";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "AuctionGera | Barn-Find Car Parts at Auction",
    template: "%s | AuctionGera",
  },
  description:
    "A barn of stored car parts, sold lot by lot at open auction. Inspect in person, bid online, pay cash on pickup.",
  openGraph: {
    siteName: "AuctionGera",
    type: "website",
    title: "AuctionGera | Barn-Find Car Parts at Auction",
    description:
      "A barn of stored car parts, sold lot by lot at open auction. Inspect in person, bid online, pay cash on pickup.",
    // Without this, sharing the site anywhere that unfurls links produces a
    // bare grey box. An auction lives or dies on people passing the link on.
    // metadataBase above makes the relative path absolute.
    images: [{ url: "/hero-poster.jpg", width: 1920, height: 1080,
               alt: "Stored car parts stacked inside the barn" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AuctionGera | Barn-Find Car Parts at Auction",
    description:
      "A barn of stored car parts, sold lot by lot at open auction. Inspect in person, bid online, pay cash on pickup.",
    images: ["/hero-poster.jpg"],
  },
  robots: { index: true, follow: true },
};

/* Tawk.to chat, same two IDs as the Flask half (Render > Environment). Set
   them on the Pages project too, or the marketing pages are the one part of
   the site with no chat. Read at build time and baked into the static HTML,
   which is how SITE_URL and AUCTION_API_URL already work here. */
const TAWK = {
  p: process.env.TAWK_PROPERTY_ID ?? "",
  w: process.env.TAWK_WIDGET_ID ?? "",
};
const CHAT_CONFIGURED = Boolean(TAWK.p && TAWK.w);

const NAV = [
  { href: "/lots", label: "Lots" },
  { href: "/the-barn", label: "The Barn" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/contact", label: "Contact" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // data-scroll-behavior is required from Next 16 on. globals.css sets
    // scroll-behavior: smooth, and without this attribute Next no longer
    // overrides it during navigation, so every route change animates a slow
    // crawl to the top instead of jumping.
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${playfair.variable}`}
    >
      <body className="font-sans bg-ink text-body antialiased flex min-h-screen flex-col">
        {/* Reveals start hidden in CSS and are shown by an observer. With
            scripting off that observer never runs, so this puts the content
            back. Styles must not depend on a script having modified the DOM:
            doing that from an inline script broke hydration and left whole
            sections invisible. */}
        <noscript>
          <style>{`[data-reveal]{opacity:1 !important;transform:none !important}`}</style>
        </noscript>

        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-gold focus:px-4 focus:py-2 focus:font-semibold focus:text-ink"
        >
          Skip to content
        </a>

        <header className="sticky top-0 z-40 border-b border-line/70 bg-ink/85 backdrop-blur">
          <nav aria-label="Main" className="mx-auto flex max-w-6xl items-center gap-6 px-5 py-4">
            <Link href="/" className="flex items-center gap-2 font-display text-xl tracking-tight">
              <span aria-hidden className="text-gold">&#9670;</span>
              {/* One flex item, or gap-2 opens a gap inside the wordmark. */}
              <span>Auction<strong className="text-gold">Gera</strong></span>
            </Link>

            <ul className="ml-auto hidden items-center gap-6 text-sm md:flex">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="underline-grow text-muted transition-colors hover:text-body"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            <AuthLink className="ml-auto md:ml-0" />
          </nav>

          {/* Nav collapses to a scrollable row on small screens. No JS drawer:
              four links do not need one. */}
          <ul className="flex gap-5 overflow-x-auto border-t border-line/70 px-5 py-2.5 text-sm md:hidden">
            {NAV.map((item) => (
              <li key={item.href} className="shrink-0">
                <Link href={item.href} className="text-muted hover:text-body">{item.label}</Link>
              </li>
            ))}
          </ul>
        </header>

        {/* Organization identity, declared once for the whole site. The
            how-it-works page carries FAQPage markup, but nothing told a search
            engine what AuctionGera actually is, so the two halves had no shared
            entity to attach to. @id is the anchor other markup can reference. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "@id": `${SITE}/#organization`,
              name: "AuctionGera",
              url: SITE,
              logo: `${SITE}/hero-poster.jpg`,
              description:
                "A barn of stored car parts, sold lot by lot at open auction. Inspect in person, bid online, pay cash on pickup.",
              parentOrganization: { "@type": "Organization", name: BUSINESS.entity },
              email: BUSINESS.email,
              telephone: BUSINESS.phone,
              address: {
                "@type": "PostalAddress",
                streetAddress: BUSINESS.addressLine,
                addressLocality: BUSINESS.addressCity,
                addressRegion: BUSINESS.addressRegion,
                postalCode: BUSINESS.addressPostal,
                addressCountry: "US",
              },
              contactPoint: {
                "@type": "ContactPoint",
                contactType: "customer service",
                email: BUSINESS.email,
                telephone: BUSINESS.phone,
                availableLanguage: "English",
              },
            }),
          }}
        />

        <main id="main" className="flex-1">{children}</main>

        <footer className="border-t border-line/70 bg-card/40">
          {/* Brand spans two tracks, then Browse / Legal / Contact take one
              each, so five is the count that keeps the row from wrapping. */}
          <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:grid-cols-2 lg:grid-cols-5">
            <div className="sm:col-span-2">
              <p className="font-display text-lg">
                Auction<strong className="text-gold">Gera</strong>
              </p>
              <p className="mt-2 max-w-sm text-sm text-muted">
                One barn, decades of stored car parts, sold lot by lot. Inspect in person,
                bid online, pay cash on pickup.
              </p>
            </div>

            <div>
              <h2 className="text-sm font-semibold">Browse</h2>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                <li><Link href="/lots" className="hover:text-body">Current lots</Link></li>
                <li><Link href="/how-it-works" className="hover:text-body">How it works</Link></li>
                <li><a href="/register" className="hover:text-body">Create an account</a></li>
              </ul>
            </div>

            <div>
              <h2 className="text-sm font-semibold">Legal</h2>
              {/* These pages live in the Flask app. */}
              <ul className="mt-3 space-y-2 text-sm text-muted">
                <li><a href="/terms" className="hover:text-body">Terms of Service</a></li>
                <li><a href="/privacy" className="hover:text-body">Privacy Policy</a></li>
                <li><a href="/opt-out" className="hover:text-body">Opt Out / Data Requests</a></li>
              </ul>
            </div>

            <div>
              <h2 className="text-sm font-semibold">Contact</h2>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                <li>
                  <a href={`mailto:${BUSINESS.email}`} className="hover:text-body">
                    {BUSINESS.email}
                  </a>
                </li>
                <li>
                  <a href={`tel:${BUSINESS.phone}`} className="hover:text-body">
                    {BUSINESS.phoneDisplay}
                  </a>
                </li>
                <li>
                  <a href={`sms:${BUSINESS.phone}`} className="hover:text-body">
                    Text {BUSINESS.phoneDisplay}
                  </a>
                </li>
              </ul>
              {/* CAN-SPAM wants a real postal address reachable from any page. */}
              <address className="mt-3 text-sm not-italic leading-relaxed text-muted">
                {BUSINESS.entity}<br />
                {BUSINESS.addressLine}<br />
                {BUSINESS.addressCity}, {BUSINESS.addressRegion} {BUSINESS.addressPostal}
              </address>
            </div>
          </div>

          <p className="border-t border-line/70 px-5 py-5 text-center text-xs text-muted">
            &copy; {new Date().getFullYear()} AuctionGera, operated by {BUSINESS.entity},
            a {BUSINESS.jurisdiction} limited liability company. All rights reserved.
          </p>
        </footer>

        {/* The embed script is deliberately not loaded here. consent.js injects
            it only after the visitor opts in, and never when the browser sends
            Global Privacy Control. Tawk is the only third party on these pages
            that sets a cookie, so loading it unasked is the thing the banner
            exists to prevent. No user attributes are set: these pages are
            pre-login, and the Flask half already identifies the bidder once
            they sign in. */}
        {CHAT_CONFIGURED && (
          <>
            <script
              dangerouslySetInnerHTML={{
                __html:
                  `window.__AG_CHAT=${JSON.stringify(TAWK)};` +
                  `var Tawk_API=Tawk_API||{},Tawk_LoadStart=new Date();` +
                  `Tawk_API.onLoad=function(){Tawk_API.setAttributes(` +
                  `{property:location.hostname,page:location.pathname},` +
                  `function(){});};`,
              }}
            />
            {/* Copied from the Flask app at build time by `npm run sync:consent`.
                One gate, one file, both halves of the site. */}
            <script src="/js/consent.js" defer />
          </>
        )}
      </body>
    </html>
  );
}
