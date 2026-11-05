import HowItWorksView from "@/components/HowItWorksView";
import { DICT, alternates } from "@/lib/i18n";

export const metadata = {
  alternates: alternates("en", "/how-it-works"),
  title: DICT.en.how.metaTitle,
  description: DICT.en.how.metaDescription,
};

export default function HowItWorksPage() {
  return <HowItWorksView lang="en" />;
}
