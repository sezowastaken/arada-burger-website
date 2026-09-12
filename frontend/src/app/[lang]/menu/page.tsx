import { notFound } from "next/navigation";
import { fetchMenu } from "@/lib/api";
import MenuClient from "./MenuClient";

type Lang = "tr" | "en";

type LocalizedMenuCategory = {
  id: string;
  name: string;
  items: {
    id: string;
    name: string;
    price: number;
    description: string;
    image: string;
    isAvailable: boolean;
  }[];
};

export default async function MenuPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  if (lang !== "tr" && lang !== "en") {
    notFound();
  }

  const validLang = lang as Lang;

  const { categories } = await fetchMenu();

  // Category order, names and membership all come from the database — adding a
  // category in the admin panel must not require a code change here.
  const localizedCategories: LocalizedMenuCategory[] = categories.map((category) => ({
    id: category.slug,
    name: category.name[validLang],
    items: category.products.map((product) => ({
      id: product.slug,
      name: product.name[validLang],
      price: product.price,
      description: product.description[validLang],
      image: product.image || "",
      isAvailable: product.isAvailable,
    })),
  }));

  const filterTitle = validLang === "tr" ? "KATEGORİLER" : "CATEGORIES";
  const allLabel = validLang === "tr" ? "TÜMÜ" : "ALL";

  return (
    <div className="relative min-h-screen flex flex-col pt-10">
      {/* 
        TOP CHECKER BAND
        - h-[72px] ve backgroundSize aynı mantıkta tutuldu
        - böylece kareler yarım kesilmiyor
        - transparan görünüm opacity + blend ile korunuyor
      */}
      <div
        className="absolute left-0 top-0 z-0 w-full opacity-35 mix-blend-multiply checkerboard"
        style={{
          height: "72px",
          backgroundSize: "72px 72px",
        }}
      />

      <div className="container mx-auto px-4 z-10 pt-12 pb-6 text-center">
        <h1 className="font-display font-extrabold text-5xl md:text-7xl uppercase tracking-tighter text-on_surface">
          {validLang === "tr" ? "MENÜ" : "MENU"}
        </h1>
        <p className="mt-2 font-bold uppercase tracking-widest text-secondary">
          Arada Burger
        </p>
      </div>

      <MenuClient
        categories={localizedCategories}
        filterTitle={filterTitle}
        allLabel={allLabel}
      />
    </div>
  );
}