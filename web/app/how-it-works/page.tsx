import Link from "next/link";

export const metadata = {
  title: "How It Works",
  description:
    "Bidding, winning, inspection, and cash-on-pickup collection terms for AuctionGera lots.",
};

const FAQ = [
  {
    q: "How do I pay?",
    a: "Cash on collection. There is no online checkout, and we do not take card or transfer at this time. Bring the exact bid amount when you collect.",
  },
  {
    q: "Can I inspect a part before bidding?",
    a: "Yes, and we would rather you did. Contact us to arrange a time. Buying a barn-find part sight-unseen is how people end up disappointed.",
  },
  {
    q: "Do you ship?",
    a: "No. Everything is collection in person. Bring a vehicle that fits the lot, and bring help if the lot is heavy. We do not load for you.",
  },
  {
    q: "What condition are parts in?",
    a: "Used, stored, and decades old. Each listing states condition as we find it. Surface rust and dust are expected. Anything with a real defect is described.",
  },
  {
    q: "Can I return a part?",
    a: "No. Every lot sells as-is, where-is, which is exactly why inspection is offered. Ask questions before you bid rather than after.",
  },
  {
    q: "What if I win and do not collect?",
    a: "Tell us if plans change. Repeatedly winning lots and not collecting will get your account suspended, since it takes the lot off the market for everyone else.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <h1 className="font-display text-4xl">How it works</h1>
      <p className="mt-3 text-lg text-muted">
        Online bidding, in-person collection, cash on pickup. No buyer premium and no
        hidden fees.
      </p>

      <ol className="mt-12 space-y-10">
        {[
          {
            n: "01", title: "Create a free account",
            body: (
              <>
                Registration takes a minute and costs nothing. You need an account to bid,
                not to browse. <a href="/register" className="text-gold hover:underline">Register here</a>.
              </>
            ),
          },
          {
            n: "02", title: "Inspect if you can",
            body: <>Arrange a viewing before bidding. Photos are honest, and they are still photos. <Link href="/contact" className="text-gold hover:underline">Contact us to book a time</Link>.</>,
          },
          {
            n: "03", title: "Place your bid",
            body: <>Each lot shows the current bid and the minimum increment. Your bid is a commitment to buy at that price if you win.</>,
          },
          {
            n: "04", title: "Win at close",
            body: <>Highest bid when the timer reaches zero takes the lot. We email you the same day to arrange collection.</>,
          },
          {
            n: "05", title: "Collect and pay cash",
            body: <>Come to the barn in the agreed window with cash and a way to carry the lot. Payment happens at handover, not before.</>,
          },
        ].map((step) => (
          <li key={step.n} className="flex gap-5">
            <span className="font-display text-3xl text-gold/40">{step.n}</span>
            <div>
              <h2 className="font-display text-xl">{step.title}</h2>
              <p className="mt-1.5 text-muted">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-14 rounded-2xl border border-dashed border-gold/40 bg-gold/5 p-5 text-sm">
        <strong className="text-gold">Details needed from you.</strong> Collection address
        or general area, inspection days and hours, and how long a winner has to collect.
        I have left these out rather than guess, and they are the questions buyers will ask first.
      </div>

      <h2 className="mt-14 font-display text-3xl">Common questions</h2>
      <dl className="mt-6 divide-y divide-line rounded-2xl border border-line bg-card">
        {FAQ.map((item) => (
          <div key={item.q} className="p-6">
            <dt className="font-semibold">{item.q}</dt>
            <dd className="mt-2 text-muted">{item.a}</dd>
          </div>
        ))}
      </dl>

      {/* FAQPage structured data. Keep in sync with the FAQ array above. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQ.map((item) => ({
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
