import BarnView from "@/components/BarnView";
import { DICT, alternates } from "@/lib/i18n";

export const metadata = {
  alternates: alternates("en", "/the-barn"),
  title: DICT.en.barn.metaTitle,
  description: DICT.en.barn.metaDescription,
};

export default function TheBarnPage() {
  return <BarnView lang="en" />;
}
