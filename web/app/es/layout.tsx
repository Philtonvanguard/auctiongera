import SiteLayout, { siteMetadata } from "@/components/SiteLayout";

// Its own root layout, so /es/ pages are served with <html lang="es">.
export const metadata = siteMetadata("es");

export default function SpanishLayout({ children }: { children: React.ReactNode }) {
  return <SiteLayout lang="es">{children}</SiteLayout>;
}
