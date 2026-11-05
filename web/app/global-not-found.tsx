import type { Metadata } from "next";
import SiteLayout from "@/components/SiteLayout";

/* The site-wide 404. With two root layouts (English and Spanish) there is no
   single layout for Next to wrap its default 404 in, and without this file it
   shipped a bare page with no lang, no header and no way back into the site.
   English, with one line in Spanish for anyone who mistyped an /es/ address. */

export const metadata: Metadata = {
  title: "Page not found | AuctionGera",
  robots: { index: false },
};

export default function GlobalNotFound() {
  return (
    <SiteLayout lang="en">
      <div className="mx-auto max-w-2xl px-5 py-24 text-center">
        <p aria-hidden className="font-display text-7xl text-gold">404</p>
        <h1 className="mt-4 font-display text-3xl">That page is not here</h1>
        <p className="mt-4 text-muted">
          It may have sold, been relisted under a new number, or the link may have a typo in it.
        </p>
        <p className="mt-8">
          <a
            href="/lots"
            className="press inline-block rounded-lg bg-gold px-6 py-3 font-semibold text-ink hover:bg-gold-light"
          >
            Browse current lots
          </a>
        </p>
        <p lang="es" className="mt-8 text-sm text-muted">
          Esta página no existe. <a href="/es/lots" className="text-gold hover:underline">Ver los lotes en español</a>.
        </p>
      </div>
    </SiteLayout>
  );
}
