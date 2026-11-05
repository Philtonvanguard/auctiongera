import BarnView from "@/components/BarnView";
import { DICT, alternates } from "@/lib/i18n";

export const metadata = {
  alternates: alternates("es", "/the-barn"),
  title: DICT.es.barn.metaTitle,
  description: DICT.es.barn.metaDescription,
};

export default function TheBarnPage() {
  return <BarnView lang="es" />;
}
