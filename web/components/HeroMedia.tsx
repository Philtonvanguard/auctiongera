"use client";

import { useEffect, useRef, useState } from "react";

/* Background footage for the hero.
 *
 * CSS can dim a video but it cannot stop one playing, so reduced motion has to
 * be resolved in JS. Anyone who has asked their OS for less movement gets the
 * still frame and no video element at all, rather than a muted-but-still-moving
 * loop behind the headline.
 *
 * Everyone else gets a pause button. A looping video that starts on its own and
 * runs beside other content needs one (WCAG 2.2.2), and reduced motion is an OS
 * setting most people never find. The button sits outside the aria-hidden
 * wrapper so screen readers and keyboards can reach it.
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
  const [paused, setPaused] = useState(false);
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setMotionOK(!query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  const toggle = () => {
    const v = video.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
      setPaused(false);
    } else {
      v.pause();
      setPaused(true);
    }
  };

  return (
    <>
      <div className="hero-media" aria-hidden="true">
        {motionOK ? (
          <video
            ref={video}
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
      {motionOK && (
        <button type="button" className="hero-pause" onClick={toggle}>
          {paused ? "Play background video" : "Pause background video"}
        </button>
      )}
    </>
  );
}
