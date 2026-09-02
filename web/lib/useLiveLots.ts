"use client";

import { useEffect, useState } from "react";
import { fetchLots, type Lot } from "./lots";

/**
 * Starts from the lots baked in at build time, then replaces them with live
 * data once the page loads. Crawlers see real content; people see real prices.
 * A failed refresh keeps the baked data rather than blanking the page.
 */
export function useLiveLots(initial: Lot[]): Lot[] {
  const [lots, setLots] = useState(initial);

  useEffect(() => {
    let cancelled = false;
    fetchLots().then((fresh) => {
      if (!cancelled && fresh) setLots(fresh);
    });
    return () => { cancelled = true; };
  }, []);

  return lots;
}
