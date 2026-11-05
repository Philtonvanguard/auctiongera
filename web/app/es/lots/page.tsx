import { getLots } from "@/lib/lots";
import LotsView from "@/components/LotsView";
import { DICT, alternates } from "@/lib/i18n";

export const metadata = {
  alternates: alternates("es", "/lots"),
  title: DICT.es.lots.metaTitle,
  description: DICT.es.lots.metaDescription,
};

export default async function LotsPage() {
  return <LotsView initial={await getLots()} lang="es" />;
}
