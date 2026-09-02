import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const playfair = Playfair_Display({
  subsets: ["latin"], weight: ["700", "800"], variable: "--font-playfair", display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL ?? "https://auctiongera.bid"),
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
  },
  robots: { index: true, follow: true },
};

const NAV = [
  { href: "/lots", label: "Lots" },
  { href: "/the-barn", label: "The Barn" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/contact", label: "Contact" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans bg-ink text-body antialiased flex min-h-screen flex-col">
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
                  <Link href={item.href} className="text-muted transition-colors hover:text-body">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            <a
              href="/login"
              className="ml-auto rounded-lg border border-gold/50 px-4 py-2 text-sm font-semibold text-gold transition-colors hover:bg-gold hover:text-ink md:ml-0"
            >
              Sign in to bid
            </a>
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

        <main id="main" className="flex-1">{children}</main>

        <footer className="border-t border-line/70 bg-card/40">
          <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:grid-cols-2 lg:grid-cols-4">
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
          </div>

          <p className="border-t border-line/70 px-5 py-5 text-center text-xs text-muted">
            &copy; {new Date().getFullYear()} AuctionGera. All rights reserved.
          </p>
        </footer>
      </body>
    </html>
  );
}
