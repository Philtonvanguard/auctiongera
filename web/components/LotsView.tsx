"use client";

import { byStatus, type Lot } from "@/lib/lots";
import { useLiveLots } from "@/lib/useLiveLots";
import LotCard from "@/components/LotCard";

const SECTIONS = [
  { key: "live", heading: "Open for bidding", blurb: "Bidding is live. Highest bid at close wins." },
  { key: "upcoming", heading: "Opening soon", blurb: "Listed and photographed. Bidding has not started yet." },
  { key: "ended", heading: "Recently closed", blurb: "Sold or passed. Kept up so you can see what things go for." },
] as const;

export default function LotsView({ initial }: { initial: Lot[] }) {
  const lots = useLiveLots(initial);

  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      <h1 className="font-display text-4xl">Current lots</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Parts come out of the barn in batches, so this list changes. Bidding, account
        sign-in, and lot detail all live on the auction pages linked from each card.
      </p>

      {lots.length === 0 && (
        <div className="mt-12 rounded-2xl border border-dashed border-line p-12 text-center">
          <p className="font-display text-xl">No lots to show right now</p>
          <p className="mx-auto mt-2 max-w-md text-muted">
            Nothing is listed at the moment. Create an account to be notified when the
            next batch comes out of the barn.
          </p>
          <a
            href="/register"
            className="mt-6 inline-block rounded-lg bg-gold px-6 py-3 font-semibold text-ink hover:bg-gold-light"
          >
            Create a free account
          </a>
        </div>
      )}

      {SECTIONS.map(({ key, heading, blurb }) => {
        const group = byStatus(lots, key);
        if (group.length === 0) return null;
        return (
          <section key={key} className="mt-14" aria-labelledby={`${key}-heading`}>
            <h2 id={`${key}-heading`} className="font-display text-2xl">
              {heading} <span className="text-muted">({group.length})</span>
            </h2>
            <p className="mt-1 text-sm text-muted">{blurb}</p>
            <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {group.map((lot) => (
                <li key={lot.id}><LotCard lot={lot} /></li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
