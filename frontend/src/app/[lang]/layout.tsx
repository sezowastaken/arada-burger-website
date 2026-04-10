import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
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
    <>
      <Header lang={validLang} />
      <main className="min-h-screen pt-24 md:pt-28">
        {children}
      </main>
      <Footer lang={validLang} />
    </>
  );
}
