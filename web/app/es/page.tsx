import { getLots } from "@/lib/lots";
import HomeView from "@/components/HomeView";
import { DICT, alternates } from "@/lib/i18n";

export const metadata = {
  alternates: alternates("es", "/"),
  description: DICT.es.site.description,
};

export default async function Home() {
  return <HomeView initial={await getLots()} lang="es" />;
}
