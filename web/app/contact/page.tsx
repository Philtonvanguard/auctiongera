import ContactForm from "@/components/ContactForm";
import Reveal from "@/components/Reveal";

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
