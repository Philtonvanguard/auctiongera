"use client";

import Link from "next/link";
import { byStatus, type Lot } from "@/lib/lots";
import { useLiveLots } from "@/lib/useLiveLots";
import LotCard from "@/components/LotCard";
import Reveal from "@/components/Reveal";
import HeroMedia from "@/components/HeroMedia";

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
      {/* ── Hero ────────────────────────────────────────────────────────────
          The gradient stays underneath the footage. It is what renders while
          the video buffers, and what a viewer sees if the file 404s. */}
      <section className="relative isolate overflow-hidden border-b border-line/70 bg-gradient-to-b from-navy/40 to-transparent">
        <HeroMedia poster="/hero-poster.jpg" src="/hero.mp4" />

        <div className="relative mx-auto max-w-6xl px-5 py-24 sm:py-32">
          <Reveal>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-gold">
              Barn-find car parts
            </p>
          </Reveal>

          <Reveal delay={80}>
            <h1 className="mt-4 max-w-3xl font-display text-4xl leading-[1.1] sm:text-6xl">
              A barn full of parts that have not moved in decades.
            </h1>
          </Reveal>

          <Reveal delay={160}>
            <p className="mt-6 max-w-xl text-lg text-muted">
              Seats, panels, wheels, trim, and the odd complete assembly. Stored dry, sold
              honestly, lot by lot. What you see in the photos is what sits in the barn.
            </p>
          </Reveal>

          <Reveal delay={240}>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/lots"
                className="press rounded-lg bg-gold px-6 py-3 font-semibold text-ink transition-colors hover:bg-gold-light"
              >
                See current lots
              </Link>
              <Link
                href="/the-barn"
                className="press rounded-lg border border-line bg-ink/40 px-6 py-3 font-semibold backdrop-blur transition-colors hover:border-gold/50 hover:text-gold"
              >
                What is in the barn
              </Link>
            </div>
          </Reveal>

          <Reveal delay={320}>
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
          </Reveal>
        </div>
      </section>

      {/* ── Current lots ───────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-16" aria-labelledby="lots-heading">
        <Reveal>
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 id="lots-heading" className="font-display text-3xl">Current lots</h2>
            <Link href="/lots" className="underline-grow text-sm text-gold hover:text-gold-light">
              View all lots
            </Link>
          </div>
        </Reveal>

        {featured.length > 0 ? (
          <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((lot, i) => (
              // Stagger caps at the third card. Past that the last item in a
              // six-card grid waits half a second, which reads as lag.
              <Reveal as="li" key={lot.id} delay={Math.min(i, 2) * 90} className="lift">
                <LotCard lot={lot} />
              </Reveal>
            ))}
          </ul>
        ) : (
          <Reveal>
            <div className="mt-8 rounded-2xl border border-dashed border-line p-12 text-center">
              <p className="font-display text-xl">Nothing open at the moment</p>
              <p className="mx-auto mt-2 max-w-md text-muted">
                Lots go up in batches as they come out of the barn. Create a free account
                and you will be first to know when the next one opens.
              </p>
              <a
                href="/register"
                className="press mt-6 inline-block rounded-lg bg-gold px-6 py-3 font-semibold text-ink hover:bg-gold-light"
              >
                Create a free account
              </a>
            </div>
          </Reveal>
        )}
      </section>

      {/* ── How it works ────────────────────────────────────────────────────
          The left column pins while the steps scroll past it. This is plain
          position: sticky, no scroll listener and no library. Sticky is inert
          below the lg breakpoint, where the column is full width and pinning
          would eat the screen. */}
      <section className="border-y border-line/70 bg-card/40" aria-labelledby="how-heading">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 lg:grid-cols-[minmax(0,22rem)_1fr] lg:gap-20">
          <div className="lg:sticky lg:top-32 lg:self-start">
            <Reveal>
              <h2 id="how-heading" className="font-display text-3xl sm:text-4xl">
                How it works
              </h2>
              <p className="mt-4 text-muted">
                Three steps, no buyer fees, no reserve games. The barn has been shut for
                a long time and we would rather these parts went to someone who wants them.
              </p>
              <Link
                href="/how-it-works"
                className="underline-grow mt-8 inline-block text-sm text-gold hover:text-gold-light"
              >
                Read the full terms
              </Link>
            </Reveal>
          </div>

          <ol className="space-y-14">
            {STEPS.map((step) => (
              <Reveal as="li" key={step.n}>
                <div className="flex items-baseline gap-5">
                  <span className="font-display text-5xl text-gold/30 sm:text-6xl">{step.n}</span>
                  <div>
                    <h3 className="font-display text-2xl">{step.title}</h3>
                    <p className="mt-3 max-w-md text-muted">{step.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
