import ContactForm from "@/components/ContactForm";
import Reveal from "@/components/Reveal";
import { BUSINESS } from "@/lib/business";

export const metadata = {
  title: "Contact",
  description:
    "Book an inspection, send a want list, or ask about a lot. We reply to everything.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <Reveal>
        <h1 className="font-display text-4xl">Get in touch</h1>
        <p className="mt-3 max-w-xl text-lg text-muted">
          Booking an inspection, chasing a specific part, or asking about a lot you have
          your eye on. All of it goes to the same place and we read every message.
        </p>
      </Reveal>

      <div className="mt-10 grid gap-10 md:grid-cols-[1.4fr_1fr]">
        <Reveal>
          <ContactForm />
        </Reveal>

        <Reveal as="aside" delay={90} className="space-y-6 text-sm">
          {/* The form used to be the only way through, and when it is
              misconfigured it tells people to email directly. That advice
              needs somewhere to land. */}
          <div className="rounded-2xl border border-line bg-card p-6">
            <h2 className="font-display text-lg text-body">Reach us directly</h2>
            <dl className="mt-3 space-y-3">
              <div>
                <dt className="text-xs uppercase tracking-wider text-muted">Email</dt>
                <dd className="mt-0.5">
                  <a href={`mailto:${BUSINESS.email}`} className="underline-grow text-gold">
                    {BUSINESS.email}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-muted">Call or text</dt>
                <dd className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <a href={`tel:${BUSINESS.phone}`} className="underline-grow text-gold">
                    {BUSINESS.phoneDisplay}
                  </a>
                  <a href={`sms:${BUSINESS.phone}`} className="text-muted hover:text-body">
                    Send a text
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-muted">Mail</dt>
                <dd className="mt-0.5">
                  <address className="not-italic leading-relaxed text-muted">
                    {BUSINESS.entity}<br />
                    {BUSINESS.addressLine}<br />
                    {BUSINESS.addressCity}, {BUSINESS.addressRegion} {BUSINESS.addressPostal}
                  </address>
                </dd>
              </div>
            </dl>
            <p className="mt-4 border-t border-line pt-3 text-xs text-muted">
              Lots are inspected by appointment at the barn, not at this address.
            </p>
          </div>

          <div className="rounded-2xl border border-line bg-card p-6">
            <h2 className="font-display text-lg text-body">Best reason to write</h2>
            <p className="mt-2 text-muted">
              Tell us the make, model, and year you are working on. Plenty of the barn is
              still unsorted, and we can look while we are in there.
            </p>
          </div>
          <div className="rounded-2xl border border-dashed border-gold/40 bg-gold/5 p-6">
            <h2 className="font-display text-lg text-gold">Bidding on a lot that closes soon?</h2>
            <p className="mt-2 text-body">
              Say so in your first line. Questions about a lot near its close get answered
              ahead of everything else, because after it closes the answer is no use to you.
            </p>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
