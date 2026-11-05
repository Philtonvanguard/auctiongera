import { getLots } from "@/lib/lots";
import LotsView from "@/components/LotsView";
import { DICT, alternates } from "@/lib/i18n";

export const metadata = {
  alternates: alternates("en", "/lots"),
  title: DICT.en.lots.metaTitle,
  description: DICT.en.lots.metaDescription,
};

export default async function LotsPage() {
  return <LotsView initial={await getLots()} lang="en" />;
}
