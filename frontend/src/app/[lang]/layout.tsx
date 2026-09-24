import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import { AnalyticsBeacon } from "@/components/analytics/AnalyticsBeacon";
import { notFound } from "next/navigation";

const locales = ["tr", "en"];

export async function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  // Validate locale
  if (!locales.includes(lang)) {
    notFound();
  }

  const validLang = lang as "tr" | "en";

  return (
    /*
      The language has to be declared on the markup, not just in the route.
      CSS `text-transform: uppercase` follows the element's language, and
      Turkish casing is not the default one: under `lang="en"` the site
      rendered "Marmaris" as MARMARIS instead of MARMARİS, and would render
      "ısı" as ISI. It also tells a screen reader which language to speak.

      This sits on a wrapper rather than on <html>, which belongs to the root
      layout and cannot see this segment's params.
    */
    <div lang={validLang}>
      <AnalyticsBeacon lang={validLang} />
      <Header lang={validLang} />
      <main className="min-h-screen pt-24 md:pt-28">
        {children}
      </main>
      <Footer lang={validLang} />
    </div>
  );
}
