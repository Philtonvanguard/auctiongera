import ContactForm from "@/components/ContactForm";
import Reveal from "@/components/Reveal";
import { BUSINESS } from "@/lib/business";
import { DICT, type Lang } from "@/lib/i18n";

export default function ContactView({ lang }: { lang: Lang }) {
  const t = DICT[lang].contact;
  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <Reveal>
        <h1 className="font-display text-4xl">{t.title}</h1>
        <p className="mt-3 max-w-xl text-lg text-muted">{t.lead}</p>
      </Reveal>

      <div className="mt-10 grid gap-10 md:grid-cols-[1.4fr_1fr]">
        <Reveal>
          <ContactForm lang={lang} />
        </Reveal>

        <Reveal as="aside" delay={90} className="space-y-6 text-sm">
          {/* The form used to be the only way through, and when it is
              misconfigured it tells people to email directly. That advice
              needs somewhere to land. */}
          <div className="rounded-2xl border border-line bg-card p-6">
            <h2 className="font-display text-lg text-body">{t.direct}</h2>
            <dl className="mt-3 space-y-3">
              <div>
                <dt className="text-xs uppercase tracking-wider text-muted">{t.email}</dt>
                <dd className="mt-0.5">
                  <a href={`mailto:${BUSINESS.email}`} className="underline-grow text-gold">
                    {BUSINESS.email}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-muted">{t.callOrText}</dt>
                <dd className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <a href={`tel:${BUSINESS.phone}`} className="underline-grow text-gold">
                    {BUSINESS.phoneDisplay}
                  </a>
                  <a href={`sms:${BUSINESS.phone}`} className="text-muted hover:text-body">
                    {t.sendText}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-muted">{t.mail}</dt>
                <dd className="mt-0.5">
                  <address className="not-italic leading-relaxed text-muted">
                    {BUSINESS.entity}<br />
                    {BUSINESS.addressLine}<br />
                    {BUSINESS.addressCity}, {BUSINESS.addressRegion} {BUSINESS.addressPostal}
                  </address>
                </dd>
              </div>
            </dl>
            <p className="mt-4 border-t border-line pt-3 text-xs text-muted">{t.notHere}</p>
          </div>

          <div className="rounded-2xl border border-line bg-card p-6">
            <h2 className="font-display text-lg text-body">{t.bestTitle}</h2>
            <p className="mt-2 text-muted">{t.bestBody}</p>
          </div>
          <div className="rounded-2xl border border-dashed border-gold/40 bg-gold/5 p-6">
            <h2 className="font-display text-lg text-gold">{t.soonTitle}</h2>
            <p className="mt-2 text-body">{t.soonBody}</p>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
