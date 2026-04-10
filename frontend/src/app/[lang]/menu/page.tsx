import { notFound } from "next/navigation";
import menuData from "@/constants/menuData.json";
import MenuClient from "./MenuClient";

type Lang = "tr" | "en";

type LocalizedMenuItem = {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
};

type LocalizedMenuCategory = {
  id: string;
  name: string;
  items: LocalizedMenuItem[];
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

  const sourceCategories = menuData.categories.map((category) => ({
    id: category.id,
    name: category.name[validLang],
    items: category.items.map((item) => ({
      id: String(item.id),
      name: item.name[validLang],
      price: item.price,
      description: item.description[validLang],
      image: item.image || "",
    })),
  }));

  const getItems = (...ids: string[]) =>
    sourceCategories
      .filter((category) => ids.includes(category.id))
      .flatMap((category) => category.items);

  const localizedCategories: LocalizedMenuCategory[] = [
    {
      id: "et-burger",
      name: validLang === "tr" ? "ET BURGER" : "BEEF BURGER",
      items: getItems("et-burgerler", "spesiyal-burgerler"),
    },
    {
      id: "tavuk-burger",
      name: validLang === "tr" ? "TAVUK BURGER" : "CHICKEN BURGER",
      items: getItems("tavuk-burgerler"),
    },
    {
      id: "hotdog",
      name: validLang === "tr" ? "HOTDOG" : "HOTDOG",
      items: getItems("hotdoglar"),
    },
    {
      id: "ilave",
      name: validLang === "tr" ? "İLAVE" : "EXTRAS",
      items: getItems("ekstralar"),
    },
    {
      id: "icecek",
      name: validLang === "tr" ? "İÇECEK" : "DRINKS",
      items: getItems("icecekler"),
    },
  ];

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