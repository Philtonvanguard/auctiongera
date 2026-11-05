import Link from "next/link";
import Reveal from "@/components/Reveal";
import { DICT, href, type Lang } from "@/lib/i18n";

export default function HowItWorksView({ lang }: { lang: Lang }) {
  const t = DICT[lang].how;
  const steps = [
    {
      title: t.register.title,
      body: (
        <>
          {t.register.body}{" "}
          <a href={href(lang, "/register")} className="text-gold hover:underline">{t.register.link}</a>.
        </>
      ),
    },
    {
      title: t.inspect.title,
      body: (
        <>
          {t.inspect.body}{" "}
          <Link href={href(lang, "/contact")} className="text-gold hover:underline">{t.inspect.link}</Link>.
        </>
      ),
    },
    ...t.steps.map((step) => ({ title: step.title, body: <>{step.body}</> })),
  ];

  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <Reveal>
        <h1 className="font-display text-4xl">{t.title}</h1>
        <p className="mt-3 text-lg text-muted">{t.lead}</p>
      </Reveal>

      <ol className="mt-12 space-y-10">
        {steps.map((step, i) => (
          <Reveal as="li" key={i} className="flex gap-5">
            <span className="font-display text-3xl text-gold/40">{String(i + 1).padStart(2, "0")}</span>
            <div>
              <h2 className="font-display text-xl">{step.title}</h2>
              <p className="mt-1.5 text-muted">{step.body}</p>
            </div>
          </Reveal>
        ))}
      </ol>

      <div className="mt-14 rounded-2xl border border-dashed border-gold/40 bg-gold/5 p-5 text-sm">
        <strong className="text-gold">{t.noteLead}</strong> {t.note}
      </div>

      <Reveal>
        <h2 className="mt-14 font-display text-3xl">{t.faqTitle}</h2>
      </Reveal>
      <Reveal>
        <dl className="mt-6 divide-y divide-line rounded-2xl border border-line bg-card">
          {t.faq.map((item) => (
            <div key={item.q} className="p-6">
              <dt className="font-semibold">{item.q}</dt>
              <dd className="mt-2 text-muted">{item.a}</dd>
            </div>
          ))}
        </dl>
      </Reveal>

      {/* FAQPage structured data, built from the same array as the list above. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            inLanguage: lang,
            mainEntity: t.faq.map((item) => ({
              "@type": "Question",
              name: item.q,
              acceptedAnswer: { "@type": "Answer", text: item.a },
            })),
          }),
        }}
      />
    </div>
  );
}
