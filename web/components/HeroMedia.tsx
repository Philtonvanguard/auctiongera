"use client";

import { useEffect, useState } from "react";

/* Background footage for the hero.
 *
 * CSS can dim a video but it cannot stop one playing, so reduced motion has to
 * be resolved in JS. Anyone who has asked their OS for less movement gets the
 * still frame and no video element at all, rather than a muted-but-still-moving
 * loop behind the headline.
 *
 * Server render is the poster. The video only swaps in after the effect runs,
 * which also means the still is what ships in the static export and what a
 * crawler sees.
 */
export default function HeroMedia({
  poster,
  src,
}: {
  poster: string;
  src: string;
}) {
  const [motionOK, setMotionOK] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setMotionOK(!query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  return (
    <div className="hero-media" aria-hidden="true">
      {motionOK ? (
        <video
          src={src}
          poster={poster}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        />
      ) : (
        <img src={poster} alt="" />
      )}
      <div className="hero-scrim" />
    </div>
  );
}
