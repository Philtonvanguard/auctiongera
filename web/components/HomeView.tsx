"use client";

import Link from "next/link";
import { byStatus, type Lot } from "@/lib/lots";
import { useLiveLots } from "@/lib/useLiveLots";
import LotCard from "@/components/LotCard";

const STEPS = [
  {
    n: "01",
    title: "Come look at it",
    body: "Photos only tell you so much. Inspection days let you put hands on a part before you commit to a number.",
  },
  {
    n: "02",
    title: "Bid online",
    body: "Create a free account and bid from anywhere. Every lot lists condition, location, and what is actually included.",
  },
  {
    n: "03",
    title: "Pay cash, take it home",
    body: "Highest bid at close wins. We contact you the same day to arrange pickup. Payment is cash on collection.",
  },
];

export default function HomeView({ initial }: { initial: Lot[] }) {
  const lots = useLiveLots(initial);
  const live = byStatus(lots, "live");
  const upcoming = byStatus(lots, "upcoming");
  const featured = [...live, ...upcoming].slice(0, 6);

  return (
    <>
      <section className="border-b border-line/70 bg-gradient-to-b from-navy/40 to-transparent">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:py-28">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-gold">
            Barn-find car parts
          </p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl leading-[1.1] sm:text-6xl">
            A barn full of parts that have not moved in decades.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted">
            Seats, panels, wheels, trim, and the odd complete assembly. Stored dry, sold
            honestly, lot by lot. What you see in the photos is what sits in the barn.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href="/lots"
              className="rounded-lg bg-gold px-6 py-3 font-semibold text-ink transition-colors hover:bg-gold-light"
            >
              See current lots
            </Link>
            <Link
              href="/the-barn"
              className="rounded-lg border border-line px-6 py-3 font-semibold transition-colors hover:border-gold/50 hover:text-gold"
            >
              What is in the barn
            </Link>
          </div>

          <dl className="mt-14 grid max-w-lg grid-cols-3 gap-6 border-t border-line pt-8">
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted">Open now</dt>
              <dd className="font-display text-3xl text-gold">{live.length}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted">Coming up</dt>
              <dd className="font-display text-3xl">{upcoming.length}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted">Buyer fees</dt>
              <dd className="font-display text-3xl">None</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16" aria-labelledby="lots-heading">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="lots-heading" className="font-display text-3xl">Current lots</h2>
          <Link href="/lots" className="text-sm text-gold hover:text-gold-light">
            View all lots
          </Link>
        </div>

        {featured.length > 0 ? (
          <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((lot) => (
              <li key={lot.id}><LotCard lot={lot} /></li>
            ))}
          </ul>
        ) : (
          <div className="mt-8 rounded-2xl border border-dashed border-line p-12 text-center">
            <p className="font-display text-xl">Nothing open at the moment</p>
            <p className="mx-auto mt-2 max-w-md text-muted">
              Lots go up in batches as they come out of the barn. Create a free account
              and you will be first to know when the next one opens.
            </p>
            <a
              href="/register"
              className="mt-6 inline-block rounded-lg bg-gold px-6 py-3 font-semibold text-ink hover:bg-gold-light"
            >
              Create a free account
            </a>
          </div>
        )}
      </section>

      <section className="border-y border-line/70 bg-card/40" aria-labelledby="how-heading">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h2 id="how-heading" className="font-display text-3xl">How it works</h2>
          <ol className="mt-10 grid gap-8 sm:grid-cols-3">
            {STEPS.map((step) => (
              <li key={step.n}>
                <p className="font-display text-4xl text-gold/40">{step.n}</p>
                <h3 className="mt-3 font-display text-xl">{step.title}</h3>
                <p className="mt-2 text-sm text-muted">{step.body}</p>
              </li>
            ))}
          </ol>
          <Link
            href="/how-it-works"
            className="mt-10 inline-block text-sm text-gold hover:text-gold-light"
          >
            Read the full terms
          </Link>
        </div>
      </section>
    </>
  );
}
