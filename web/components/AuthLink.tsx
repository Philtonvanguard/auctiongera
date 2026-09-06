"use client";

import { useEffect, useState } from "react";

type Me =
  | { authenticated: true; username: string; is_admin: boolean }
  | { authenticated: false };

/* Header sign-in control.
 *
 * These pages are prerendered files on a CDN, so the markup cannot know who is
 * reading it. The header therefore told everyone to "Sign in to bid", signed-in
 * bidders included, and since login drops you back on a static page that is
 * what made a successful login look like a failed one.
 *
 * Renders the signed-out label first, which is what ships in the static HTML
 * and what a crawler sees, then corrects itself once /api/me answers. A failed
 * request leaves the sign-in link in place, which is the safe way to be wrong.
 */
export default function AuthLink({ className = "" }: { className?: string }) {
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/me", { cache: "no-store", credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: Me | null) => {
        if (!cancelled && data) setMe(data);
      })
      .catch(() => {
        /* Offline or Flask asleep. Keep showing the sign-in link. */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (me?.authenticated) {
    return (
      <span className={`flex items-center gap-3 text-sm ${className}`}>
        <span className="text-muted">
          Signed in as <span className="text-body">{me.username}</span>
        </span>
        {me.is_admin && (
          <a href="/admin" className="underline-grow text-gold hover:text-gold-light">
            Admin
          </a>
        )}
        <a href="/logout" className="underline-grow text-muted hover:text-body">
          Sign out
        </a>
      </span>
    );
  }

  return (
    <a
      href="/login"
      className={`press rounded-lg border border-gold/50 px-4 py-2 text-sm font-semibold text-gold transition-colors hover:bg-gold hover:text-ink ${className}`}
    >
      Sign in to bid
    </a>
  );
}
