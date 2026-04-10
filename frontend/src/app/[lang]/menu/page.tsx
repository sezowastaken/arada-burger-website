import { notFound } from "next/navigation";
import menuData from "@/constants/menuData.json";
import MenuClient from "./MenuClient";

export default async function MenuPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  if (lang !== "tr" && lang !== "en") {
    notFound();
  }

  const validLang = lang as "tr" | "en";

  const baseCategories = menuData.categories.map((category) => ({
    id: category.id,
    name: category.name[validLang],
    items: category.items.map((item) => ({
      id: item.id.toString(),
      name: item.name[validLang],
      price: item.price,
      description: item.description[validLang],
      image: item.image,
    })),
  }));

  const hasExtras = baseCategories.some((category) => category.id === "ekstralar");
  const hasDrinks = baseCategories.some((category) => category.id === "icecekler");

  const localizedCategories = [
    ...baseCategories,
    ...(!hasExtras
      ? [
          {
            id: "ekstralar",
            name: validLang === "tr" ? "EKSTRALAR" : "EXTRAS",
            items: [],
          },
        ]
      : []),
    ...(!hasDrinks
      ? [
          {
            id: "icecekler",
            name: validLang === "tr" ? "İÇECEKLER" : "DRINKS",
            items: [],
          },
        ]
      : []),
  ];

  const filterTitle = validLang === "tr" ? "KATEGORİLER" : "CATEGORIES";

  return (
    <div className="min-h-screen relative flex flex-col pt-10">
      <div className="absolute top-0 left-0 w-full h-16 checkerboard opacity-40 mix-blend-multiply z-0"></div>

      <div className="container mx-auto px-4 z-10 pt-10 pb-4 text-center">
        <h1 className="font-display font-extrabold text-5xl md:text-7xl uppercase tracking-tighter text-on_surface">
          {validLang === "tr" ? "MENÜ" : "MENU"}
        </h1>
        <p className="text-secondary mt-2 font-bold tracking-widest uppercase">
          Arada Burger
        </p>
      </div>

      <MenuClient categories={localizedCategories} filterTitle={filterTitle} />
    </div>
  );
}