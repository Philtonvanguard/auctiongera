import HowItWorksView from "@/components/HowItWorksView";
import { DICT, alternates } from "@/lib/i18n";

export const metadata = {
  alternates: alternates("es", "/how-it-works"),
  title: DICT.es.how.metaTitle,
  description: DICT.es.how.metaDescription,
};

export default function HowItWorksPage() {
  return <HowItWorksView lang="es" />;
}
