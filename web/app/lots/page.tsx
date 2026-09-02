import { getLots } from "@/lib/lots";
import LotsView from "@/components/LotsView";

export const metadata = {
  title: "Current Lots",
  description:
    "Every car part lot currently open, opening soon, or recently closed. Condition and location listed on each.",
};

export default async function LotsPage() {
  return <LotsView initial={await getLots()} />;
}
