"use client";

import React, { useMemo, useRef, useState } from "react";
import Image from "next/image";
import CategoryFilter from "@/components/ui/CategoryFilter";
import ProductCard from "@/components/ui/ProductCard";

interface MenuItem {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
}

interface MenuCategory {
  id: string;
  name: string;
  items: MenuItem[];
}

interface MenuClientProps {
  categories: MenuCategory[];
  filterTitle: string;
  allLabel: string;
}

export default function MenuClient({
  categories,
  filterTitle,
  allLabel,
}: MenuClientProps) {
  const [activeCategory, setActiveCategory] = useState<string>("all");

  /**
   * CONTENT ANCHOR
   * -------------------------------------------------------------
   * Kategori değişince ekranı sayfanın en tepesine değil,
   * sağ içerik alanının başlangıcına yakın güvenli bir noktaya getiriyoruz.
   *
   * Offset'i değiştirerek kullanıcının göreceği "kadrajı" ayarlayabilirsin.
   * - offset büyürse daha aşağıdan başlar
   * - offset küçülürse daha yukarıdan başlar
   */
  const contentTopRef = useRef<HTMLDivElement | null>(null);

  const filterCategories = useMemo(
    () => [
      { id: "all", label: allLabel },
      ...categories.map((category) => ({
        id: category.id,
        label: category.name,
      })),
    ],
    [categories, allLabel]
  );

  const visibleCategories = useMemo(() => {
    if (activeCategory === "all") return categories;
    return categories.filter((category) => category.id === activeCategory);
  }, [activeCategory, categories]);

  const scrollToContentStart = () => {
    if (!contentTopRef.current) return;

    /**
     * SCROLL OFFSET GUIDE
     * -------------------------------------------------------------
     * Bu değer sabit header + biraz nefes alanı için düşülüyor.
     * İstersen 140 / 150 / 160 gibi değerler deneyebilirsin.
     */
    const offset = 145;
    const rect = contentTopRef.current.getBoundingClientRect();
    const targetY = rect.top + window.scrollY - offset;

    window.scrollTo({
      top: Math.max(0, targetY),
      behavior: "smooth",
    });
  };

  const handleCategoryClick = (id: string) => {
    setActiveCategory(id);

    /**
     * FILTER + SCROLL SYNC
     * -------------------------------------------------------------
     * Önce state güncellensin, DOM yeni kategoriye göre render olsun,
     * sonra scroll çalışsın diye iki kat requestAnimationFrame kullanıyoruz.
     */
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollToContentStart();
      });
    });
  };

  return (
    <div className="relative z-10 mx-auto w-full max-w-[1500px] px-6 py-10 md:px-8 md:py-16 xl:px-12">
      {/* =========================================================
          MENU PAGE LAYOUT GUIDE
          ---------------------------------------------------------
          1) SAYFAYI TOPTAN DAHA FERAH / DAHA DAR YAPMAK:
             - max-w-[1500px] => tüm layout genişliği
             - küçültürsen daha fazla sağ/sol boşluk oluşur

          2) SAĞ / SOL KENAR BOŞLUKLARI:
             - px-6 / md:px-8 / xl:px-12 => dış yatay boşluk
             - bunları artırırsan içerik kenarlardan uzaklaşır

          3) SIDEBAR VE ÜRÜN ALANI ARASI MESAFE:
             - lg:gap-16 / xl:gap-24
             - bunu artırırsan island ile kartlar birbirinden uzaklaşır

          4) SIDEBAR BOYUTU:
             - lg:w-[220px] / xl:w-[240px]
             - küçültürsen filtre island daha kompakt olur

          5) SAĞDAKİ KART ALANINI TOPTAN DARALTMAK:
             - max-w-[1080px]
             - küçültürsen kartların bulunduğu toplam alan daralır

          6) STICKY ISLAND:
             - sticky top-32
             - top değerini artırırsan daha aşağıdan yapışır

          7) KATEGORİ DEĞİŞİNCE SCROLL NOKTASI:
             - contentTopRef + offset
             - scrollToContentStart() içindeki offset ile oynayabilirsin
         ========================================================= */}

      <div className="flex flex-col items-start gap-8 lg:flex-row lg:items-stretch lg:gap-16 xl:gap-24">
        {/* ======================================================
            SIDEBAR COLUMN
            - Sticky island burada
            - Sidebar width ve maskot ayarları buradan yönetilir
           ====================================================== */}
        <aside className="relative hidden shrink-0 lg:block lg:w-[220px] xl:w-[240px]">
          <div className="sticky top-32">
            <CategoryFilter
              categories={filterCategories}
              activeCategory={activeCategory}
              onCategoryClick={handleCategoryClick}
              title={filterTitle}
            />

            {/* 
              SOL MASKOT
              - Daha sola almak için -left değerini büyüt
              - Daha aşağı/yukarı için top-[...] değiştir
              - Daha küçük/büyük için w-* / h-* değiştir
            */}
            <div className="pointer-events-none absolute -left-10 top-[86%] z-30 h-24 w-24 transition-transform duration-300 ease-in-out hover:scale-110 hover:rotate-3 xl:-left-14 xl:h-32 xl:w-32">
              <Image
                src="/brand/mascots/soda_maskot.png"
                alt="Soda Mascot"
                width={180}
                height={180}
                className="h-full w-full object-contain drop-shadow-xl"
              />
            </div>
          </div>
        </aside>

        {/* ======================================================
            MAIN CONTENT COLUMN
            - Sağ taraftaki ürün alanı
            - contentTopRef burada: kategori değişince ekran bu alana gelir
           ====================================================== */}
        <div className="w-full flex-1">
          <div
            ref={contentTopRef}
            className="mx-auto w-full max-w-[1080px]"
          >
            {/* 
              KATEGORİLER ARASI DİKEY MESAFE:
              - gap-16 / lg:gap-24
              - bunu artırırsan bölüm araları açılır
            */}
            <div className="flex flex-col gap-16 lg:gap-24">
              {visibleCategories.map((category) => (
                <section key={category.id} id={category.id} className="min-h-[200px]">
                  {/* 
                    BAŞLIK BOYUTU:
                    - text-4xl md:text-5xl
                    - küçültüldü, daha sakin görünür
                  */}
                  <h2 className="inline-block font-display text-4xl font-black uppercase tracking-tighter text-on_surface md:text-5xl">
                    {category.name}
                    <div className="mt-2 h-2.5 w-full bg-primary" />
                  </h2>

                  {/* 
                    KART GRID ALANI
                    - grid yapısı korunuyor
                    - kart aralıkları iyi olduğu için büyük oynamadık
                  */}
                  {category.items.length > 0 ? (
                    <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 lg:gap-10">
                      {category.items.map((item) => (
                        <ProductCard
                          key={item.id}
                          imageSrc={item.image}
                          imageAlt={item.name}
                          name={item.name}
                          price={`₺${item.price}`}
                          description={item.description}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="mt-8 rounded-3xl border-4 border-dashed border-on_surface/10 p-12 text-center font-display font-bold uppercase tracking-widest text-on_surface/30">
                      Yakında Gelecek...
                    </div>
                  )}
                </section>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}