import Reveal from "@/components/Reveal";
import { DICT, href, type Lang } from "@/lib/i18n";

export default function BarnView({ lang }: { lang: Lang }) {
  const t = DICT[lang].barn;
  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <Reveal>
        <h1 className="font-display text-4xl">{t.title}</h1>
      </Reveal>

      <div className="mt-8 space-y-6 text-lg leading-relaxed text-muted">
        <p>{t.p1}</p>
        <p className="rounded-xl border border-dashed border-gold/40 bg-gold/5 p-5 text-base text-body">
          <strong className="text-gold">{t.calloutLead}</strong> {t.callout}
        </p>
        <p>{t.p2}</p>
        <p>{t.p3}</p>
      </div>

      <Reveal>
        <h2 className="mt-14 font-display text-2xl text-body">{t.tendsTitle}</h2>
      </Reveal>
      <ul className="mt-5 grid gap-3 sm:grid-cols-2">
        {t.tends.map((item, i) => (
          <Reveal as="li" key={item} delay={Math.min(i, 3) * 70}
            className="lift rounded-xl border border-line bg-card px-4 py-3 text-sm">
            {item}
          </Reveal>
        ))}
      </ul>
      <p className="mt-4 text-sm text-muted">{t.tendsNote}</p>

      <Reveal>
        <div className="mt-14 rounded-2xl border border-line bg-card p-8">
          <h2 className="font-display text-2xl">{t.askTitle}</h2>
          <p className="mt-2 text-muted">{t.askBody}</p>
          <a
            href={href(lang, "/contact")}
            className="press mt-6 inline-block rounded-lg bg-gold px-6 py-3 font-semibold text-ink hover:bg-gold-light"
          >
            {t.askCta}
          </a>
        </div>
      </Reveal>
    </div>
  );
}
