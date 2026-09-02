import { type Lot, money, closesOn } from "@/lib/lots";

const BADGE: Record<Lot["status"], { label: string; className: string }> = {
  live: { label: "Bidding open", className: "bg-success/15 text-success ring-success/30" },
  upcoming: { label: "Opens soon", className: "bg-gold/15 text-gold ring-gold/30" },
  ended: { label: "Closed", className: "bg-muted/15 text-muted ring-muted/30" },
  cancelled: { label: "Withdrawn", className: "bg-danger/15 text-danger ring-danger/30" },
};

export default function LotCard({ lot }: { lot: Lot }) {
  const badge = BADGE[lot.status] ?? BADGE.ended;
  const priceLabel = lot.bid_count > 0 ? "Current bid" : "Opening bid";

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-card transition-colors hover:border-gold/40">
      {/* ponytail: plain <img>, not next/image. image_url is a free-text admin
          field, so allowing any remote host through the optimizer would let it
          fetch arbitrary URLs server-side. Swap to next/image once images move
          to one known host. */}
      <div className="aspect-[4/3] overflow-hidden bg-card-2">
        {lot.image_url ? (
          <img
            src={lot.image_url}
            alt={lot.title}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted">
            No photo yet
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${badge.className}`}>
            {badge.label}
          </span>
          {lot.category && <span className="text-xs text-muted">{lot.category}</span>}
        </div>

        <h3 className="font-display text-lg leading-snug">
          <a href={lot.url} className="after:absolute after:inset-0 hover:text-gold">
            {lot.title}
          </a>
        </h3>

        <dl className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
          {lot.condition && (
            <div className="flex gap-1"><dt>Condition:</dt><dd className="text-body">{lot.condition}</dd></div>
          )}
          {lot.location && (
            <div className="flex gap-1"><dt>Location:</dt><dd className="text-body">{lot.location}</dd></div>
          )}
        </dl>

        <div className="mt-auto flex items-end justify-between border-t border-line pt-4">
          <div>
            <p className="text-xs text-muted">{priceLabel}</p>
            <p className="font-display text-2xl text-gold">{money(lot.current_price)}</p>
          </div>
          <div className="text-right text-xs text-muted">
            <p>{lot.bid_count} {lot.bid_count === 1 ? "bid" : "bids"}</p>
            {lot.status !== "ended" && <p className="mt-1">Closes {closesOn(lot.end_time)}</p>}
          </div>
        </div>
      </div>
    </article>
  );
}
