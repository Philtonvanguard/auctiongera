"use client";

import { useEffect, useRef } from "react";

/* Scroll-triggered reveal.
 *
 * No animation library. IntersectionObserver is universally supported and this
 * is twenty lines, so pulling in Framer Motion or GSAP to fade things in would
 * be a dependency for something the platform already does.
 *
 * Two failure modes are handled deliberately, because getting them wrong hides
 * content permanently rather than merely looking worse:
 *
 *   No JS   The hidden state lives behind a `.js` class that only a script can
 *           set, so without JS every element renders visible.
 *   Reduced motion
 *           globals.css never hides the element in the first place, and the
 *           observer is skipped, so nothing depends on an animation that will
 *           not run.
 *
 * Elements reveal once and are then unobserved. Re-animating on every scroll
 * past is the thing that makes these effects feel cheap.
 */
export default function Reveal({
  children,
  delay = 0,
  as: Tag = "div",
  className = "",
}: {
  children: React.ReactNode;
  /** Stagger, in ms. Keep it under ~240 or the page feels slow to load. */
  delay?: number;
  /* Keep the real element. Collapsing an <aside> or <li> into a <div> to make
     it animatable trades a landmark or list semantics for a fade. */
  as?: "div" | "section" | "li" | "article" | "aside";
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.disconnect();
      },
      // Fires slightly before the element reaches the bottom edge, so the
      // motion reads as the section arriving rather than catching up.
      { rootMargin: "0px 0px -12% 0px", threshold: 0.05 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as React.Ref<never>}
      data-reveal=""
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={className}
    >
      {children}
    </Tag>
  );
}
