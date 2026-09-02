import type { MetadataRoute } from "next";

// Required by output:"export" so Next prerenders this instead of treating it
// as a dynamic route handler.
export const dynamic = "force-static";

const SITE = process.env.SITE_URL ?? "https://auctiongera.bid";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] },
    sitemap: `${SITE}/sitemap.xml`,
  };
}
