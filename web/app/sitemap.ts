import type { MetadataRoute } from "next";
import { getLots } from "@/lib/lots";

// Required by output:"export" so Next prerenders this instead of treating it
// as a dynamic route handler.
export const dynamic = "force-static";

const SITE = process.env.SITE_URL ?? "https://auctiongera.bid";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Each marketing page is listed in both languages, and each entry names its
  // twin, which is how a sitemap carries hreflang.
  const pages = ["", "/lots", "/the-barn", "/how-it-works", "/contact"].flatMap((path) => {
    const languages = { en: `${SITE}${path}`, es: `${SITE}/es${path}` };
    return [languages.en, languages.es].map((url) => ({
      url,
      lastModified: new Date(),
      changeFrequency: path === "/lots" ? ("daily" as const) : ("monthly" as const),
      priority: path === "" ? 1 : 0.8,
      alternates: { languages },
    }));
  });

  // Lot pages are served by Flask but belong in the sitemap: they are what
  // people actually search for.
  const lots = await getLots();
  return [
    ...pages,
    ...lots.map((lot) => ({
      url: `${SITE}/auction/${lot.id}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.9,
    })),
  ];
}
