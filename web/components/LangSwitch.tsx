"use client";

import { usePathname } from "next/navigation";
import { DICT, href, type Lang } from "@/lib/i18n";

/* Español / English link to the same page in the other language.
 *
 * A client component only because a layout cannot read the URL. The pathname
 * is known at prerender, so the static HTML already carries the right href.
 * A plain <a>: the two languages are separate root layouts, and Next does a
 * full page load between those anyway.
 */
export default function LangSwitch({ lang }: { lang: Lang }) {
  const path = usePathname() ?? "/";
  const other: Lang = lang === "es" ? "en" : "es";
  const english = lang === "es" ? path.replace(/^\/es(?=\/|$)/, "") || "/" : path;
  // The 404 page has no twin to point at, so it offers the other home page.
  const target = english.includes("_not-found") ? "/" : english;

  return (
    <a
      href={href(other, target)}
      hrefLang={other}
      lang={other}
      className="underline-grow text-muted transition-colors hover:text-body"
    >
      {DICT[lang].shell.switchTo}
    </a>
  );
}
