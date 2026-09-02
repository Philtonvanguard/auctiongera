export type LotStatus = "live" | "upcoming" | "ended" | "cancelled";

export type Lot = {
  id: number;
  title: string;
  description: string;
  category: string;
  dimensions: string | null;
  location: string | null;
  condition: string | null;
  starting_price: number;
  current_price: number;
  bid_increment: number;
  bid_count: number;
  image_url: string;
  start_time: string;
  end_time: string;
  status: LotStatus;
  url: string;
};

const API = process.env.AUCTION_API_URL ?? "http://127.0.0.1:5000";

/**
 * Build-time fetch. The output is baked into the static HTML, which is what
 * search engines read, so it must never throw: a failure here would fail the
 * whole build. Callers get an empty list and render their own empty state.
 */
export async function getLots(): Promise<Lot[]> {
  try {
    const res = await fetch(`${API}/api/lots`, { signal: AbortSignal.timeout(45_000) });
    if (!res.ok) {
      console.error(`getLots: ${API} returned ${res.status}`);
      return [];
    }
    return (await res.json()) as Lot[];
  } catch (err) {
    console.error("getLots failed:", err);
    return [];
  }
}

/**
 * Browser fetch. Same-origin, because Cloudflare proxies /api/lots to Flask.
 * Prices move with every bid, so the baked-in numbers get replaced on load.
 */
export async function fetchLots(): Promise<Lot[] | null> {
  try {
    const res = await fetch("/api/lots", { cache: "no-store" });
    return res.ok ? ((await res.json()) as Lot[]) : null;
  } catch {
    return null;
  }
}

export const byStatus = (lots: Lot[], status: LotStatus) =>
  lots.filter((l) => l.status === status);

export const money = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

/** Absolute date. Live countdowns belong on the Flask bid page, not here. */
export const closesOn = (iso: string) =>
  new Date(iso + "Z").toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short",
  });
