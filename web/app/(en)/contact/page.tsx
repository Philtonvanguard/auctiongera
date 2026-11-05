import ContactView from "@/components/ContactView";
import { DICT, alternates } from "@/lib/i18n";

export const metadata = {
  alternates: alternates("en", "/contact"),
  title: DICT.en.contact.metaTitle,
  description: DICT.en.contact.metaDescription,
};

export default function ContactPage() {
  return <ContactView lang="en" />;
}
