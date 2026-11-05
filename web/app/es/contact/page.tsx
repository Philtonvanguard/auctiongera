import ContactView from "@/components/ContactView";
import { DICT, alternates } from "@/lib/i18n";

export const metadata = {
  alternates: alternates("es", "/contact"),
  title: DICT.es.contact.metaTitle,
  description: DICT.es.contact.metaDescription,
};

export default function ContactPage() {
  return <ContactView lang="es" />;
}
