import Reveal from "@/components/Reveal";

export const metadata = {
  title: "The Barn",
  description:
    "Where the parts come from: one barn, stored dry for decades, now being emptied lot by lot.",
};

export default function TheBarnPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <Reveal>
        <h1 className="font-display text-4xl">The barn</h1>
      </Reveal>

      <div className="mt-8 space-y-6 text-lg leading-relaxed text-muted">
        <p>
          Everything sold here comes out of one building. No consignors, no drop-shippers,
          no parts sourced from somewhere else and relisted. One barn, one owner, one
          collection being worked through shelf by shelf.
        </p>
        <p className="rounded-xl border border-dashed border-gold/40 bg-gold/5 p-5 text-base text-body">
          <strong className="text-gold">The building is being cleared.</strong> Work is
          going floor by floor, and what comes out is listed as it is reached. Nothing is
          being held back for a better price later.
        </p>
        <p>
          The parts were stored under roof, out of the weather. That matters. Surface rust
          and dust are normal for anything that has sat this long. Structural rot generally
          is not, and where a part has a real problem we say so in the listing rather than
          shooting around it.
        </p>
        <p>
          Lots are photographed as they are found. We do not clean parts up to flatter them
          in pictures. What you see is what sits on the shelf.
        </p>
      </div>

      <Reveal>
        <h2 className="mt-14 font-display text-2xl text-body">What tends to come up</h2>
      </Reveal>
      <ul className="mt-5 grid gap-3 sm:grid-cols-2">
        {["Seats and interior trim", "Body panels and fenders", "Wheels and hubcaps",
          "Glass and lighting", "Engine and drivetrain parts", "Mixed hardware lots"].map((item, i) => (
          <Reveal as="li" key={item} delay={Math.min(i, 3) * 70}
            className="lift rounded-xl border border-line bg-card px-4 py-3 text-sm">
            {item}
          </Reveal>
        ))}
      </ul>
      <p className="mt-4 text-sm text-muted">
        Categories shift as we work deeper into the building. The barn structure itself,
        including reclaimable timber, may be offered once the contents are cleared.
      </p>

      <Reveal>
        <div className="mt-14 rounded-2xl border border-line bg-card p-8">
          <h2 className="font-display text-2xl">Looking for something specific?</h2>
          <p className="mt-2 text-muted">
            Plenty is still unsorted. If you are hunting a particular part, tell us the make,
            model, and year and we will look while we are in there.
          </p>
          <a
            href="/contact"
            className="press mt-6 inline-block rounded-lg bg-gold px-6 py-3 font-semibold text-ink hover:bg-gold-light"
          >
            Send us a want list
          </a>
        </div>
      </Reveal>
    </div>
  );
}
