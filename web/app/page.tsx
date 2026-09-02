import { getLots } from "@/lib/lots";
import HomeView from "@/components/HomeView";

export const metadata = {
  description:
    "A barn of stored car parts, sold lot by lot at open auction. Inspect in person, bid online, pay cash on pickup.",
};

// Lots are fetched at build time so the static HTML carries real content for
// crawlers. HomeView then refreshes them in the browser for live prices.
export default async function Home() {
  return <HomeView initial={await getLots()} />;
}
