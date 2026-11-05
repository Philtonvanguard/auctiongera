import { getLots } from "@/lib/lots";
import HomeView from "@/components/HomeView";
import { DICT, alternates } from "@/lib/i18n";

export const metadata = {
  alternates: alternates("en", "/"),
  description: DICT.en.site.description,
};

// Lots are fetched at build time so the static HTML carries real content for
// crawlers. HomeView then refreshes them in the browser for live prices.
export default async function Home() {
  return <HomeView initial={await getLots()} lang="en" />;
}
