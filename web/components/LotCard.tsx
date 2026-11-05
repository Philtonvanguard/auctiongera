import { type Lot, money, closesOn } from "@/lib/lots";
import { DICT, type Lang } from "@/lib/i18n";

const BADGE: Record<Lot["status"], string> = {
  live: "bg-success/15 text-success ring-success/30",
  upcoming: "bg-gold/15 text-gold ring-gold/30",
  ended: "bg-muted/15 text-muted ring-muted/30",
  cancelled: "bg-danger/15 text-danger ring-danger/30",
};

export default function LotCard({ lot, lang }: { lot: Lot; lang: Lang }) {
  const t = DICT[lang].card;
  const status = lot.status in BADGE ? lot.status : "ended";
  const priceLabel = lot.bid_count > 0 ? t.currentBid : t.openingBid;
  // Falls back to image_url so a feed cached from before the gallery shipped
  // still renders a cover instead of the empty state.
  const photos = lot.images?.length ? lot.images : lot.image_url ? [lot.image_url] : [];
  const cover = photos[0];

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-card transition-colors hover:border-gold/40">
      {/* ponytail: plain <img>, not next/image. image_url is a free-text admin
          field, so allowing any remote host through the optimizer would let it
          fetch arbitrary URLs server-side. Swap to next/image once images move
          to one known host. */}
      <div className="relative aspect-[4/3] overflow-hidden bg-card-2">
        {cover ? (
          <img
            src={cover}
            alt={lot.title}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted">
            {t.noPhoto}
          </div>
        )}
        {photos.length > 1 && (
          // Tells buyers there is more to see before they click. A lot with one
          // photo looks thinner than the same lot with six.
          <span className="absolute bottom-2 right-2 rounded-full bg-ink/80 px-2.5 py-1 text-xs font-medium backdrop-blur">
            {t.photos(photos.length)}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${BADGE[status]}`}>
            {t.badge[status]}
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
            <div className="flex gap-1"><dt>{t.condition}</dt><dd className="text-body">{lot.condition}</dd></div>
          )}
          {lot.location && (
            <div className="flex gap-1"><dt>{t.location}</dt><dd className="text-body">{lot.location}</dd></div>
          )}
        </dl>

        <div className="mt-auto flex items-end justify-between border-t border-line pt-4">
          <div>
            <p className="text-xs text-muted">{priceLabel}</p>
            <p className="font-display text-2xl text-gold">{money(lot.current_price, DICT[lang].locale)}</p>
          </div>
          <div className="text-right text-xs text-muted">
            <p>{t.bids(lot.bid_count)}</p>
            {lot.status !== "ended" && <p className="mt-1">{t.closes} {closesOn(lot.end_time, DICT[lang].locale)}</p>}
          </div>
        </div>
      </div>
    </article>
  );
}
