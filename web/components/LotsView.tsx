"use client";

import { byStatus, type Lot } from "@/lib/lots";
import { useLiveLots } from "@/lib/useLiveLots";
import LotCard from "@/components/LotCard";
import Reveal from "@/components/Reveal";
import { DICT, href, type Lang } from "@/lib/i18n";

const SECTIONS = ["live", "upcoming", "ended"] as const;

export default function LotsView({ initial, lang }: { initial: Lot[]; lang: Lang }) {
  const t = DICT[lang].lots;
  const lots = useLiveLots(initial);

  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      <Reveal>
        <h1 className="font-display text-4xl">{t.title}</h1>
        <p className="mt-3 max-w-2xl text-muted">{t.lead}</p>
      </Reveal>

      {lots.length === 0 && (
        <Reveal>
          <div className="mt-12 rounded-2xl border border-dashed border-line p-12 text-center">
            <p className="font-display text-xl">{t.emptyTitle}</p>
            <p className="mx-auto mt-2 max-w-md text-muted">{t.emptyBody}</p>
            <a
              href={href(lang, "/register")}
              className="press mt-6 inline-block rounded-lg bg-gold px-6 py-3 font-semibold text-ink hover:bg-gold-light"
            >
              {t.createAccount}
            </a>
          </div>
        </Reveal>
      )}

      {SECTIONS.map((key) => {
        const { heading, blurb } = t.sections[key];
        const group = byStatus(lots, key);
        if (group.length === 0) return null;
        return (
          <section key={key} className="mt-14" aria-labelledby={`${key}-heading`}>
            <Reveal>
              <h2 id={`${key}-heading`} className="font-display text-2xl">
                {heading} <span className="text-muted">({group.length})</span>
              </h2>
              <p className="mt-1 text-sm text-muted">{blurb}</p>
            </Reveal>
            <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {group.map((lot, i) => (
                // Stagger caps at the third card, as on the home page: past
                // that the tail of a long grid visibly lags the scroll.
                <Reveal as="li" key={lot.id} delay={Math.min(i, 2) * 90} className="lift">
                  <LotCard lot={lot} lang={lang} />
                </Reveal>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
