"use client";

import React, { useMemo, useRef, useState } from "react";
import Image from "next/image";
import CategoryFilter from "@/components/ui/CategoryFilter";
import ProductCard from "@/components/ui/ProductCard";
import MobileProductAccordion from "@/components/ui/MobileProductAccordion";
import { LayoutGroup } from "framer-motion";

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

    const isTurkish = allLabel === "TÜMÜ";

  const getMobileCategoryAsset = (id: string) => {
    switch (id) {
      case "all":
        return "/brand/logo/logo_background_removed.png";
      case "et-burger":
        return "/brand/mascots/burger_maskot.png";
      case "tavuk-burger":
        return "/brand/mascots/burger_maskot.png";
      case "hotdog":
        return "/brand/mascots/hotdog_maskot.png";
      case "ilave":
        return "/brand/mascots/patates_maskotu.png";
      case "icecek":
        return "/brand/mascots/soda_maskot.png";
      default:
        return "/brand/logo/logo_background_removed.png";
    }
  };

  const getCompactMobileLabel = (id: string) => {
    if (isTurkish) {
      switch (id) {
        case "all":
          return "TÜMÜ";
        case "et-burger":
          return "ET";
        case "tavuk-burger":
          return "TAVUK";
        case "hotdog":
          return "HOTDOG";
        case "ilave":
          return "İLAVE";
        case "icecek":
          return "İÇECEK";
        default:
          return "";
      }
    }

    switch (id) {
      case "all":
        return "ALL";
      case "et-burger":
        return "BEEF";
      case "tavuk-burger":
        return "CHICKEN";
      case "hotdog":
        return "HOTDOG";
      case "ilave":
        return "EXTRAS";
      case "icecek":
        return "DRINKS";
      default:
        return "";
    }
  };

    const getMobileCategoryImageClass = (id: string) => {
    /**
     * ICON TUNING GUIDE
     * ---------------------------------------------------------
     * h-[..] / w-[..]      = ikonun gerçek boyutu
     * translate-x-[..]     = sağa/sola kaydırma
     *   - pozitif => sağa
     *   - negatif => sola
     * translate-y-[..]     = aşağı/yukarı kaydırma
     *   - pozitif => aşağı
     *   - negatif => yukarı
     * scale-[..]           = ekstra zoom
     *
     * Örnek:
     * - hotdog biraz sola kaymışsa translate-x değerini küçült
     * - drinks biraz aşağıdaysa translate-y değerini azalt
     * - bir ikon küçük geliyorsa h/w veya scale artır
     */
    switch (id) {
      case "all":
        return "h-[56px] w-[56px] translate-x-0 translate-y-0 scale-100";

      case "et-burger":
        // İnek burger maskotu: optik olarak merkezde
        return "h-[84px] w-[84px] translate-x-0 translate-y-[2px] scale-[1.08]";

      case "tavuk-burger":
        // Tavuk burger maskotu: etiyle aynı durmalı
        return "h-[84px] w-[84px] translate-x-0 translate-y-[2px] scale-[1.08]";

      case "hotdog":
        // Sosisli maskotu: Asset'in doğal boşluğu nedeniyle sağa kayık duruyordu. 
        // '-translate-x-[1px]' ile sola, 'translate-y-[3px]' ile aşağı merkezlendi.
        return "h-[86px] w-[86px] -translate-x-[1px] translate-y-[3px] scale-[1.05]";

      case "ilave":
        // Patates (Extras) maskotu: Optik ağırlığı yukarıdaydı, 'translate-y-[3px]' ile aşağı çekildi.
        return "h-[82px] w-[82px] translate-x-0 translate-y-[3px] scale-[1.08]";

      case "icecek":
        // İçecek maskotu: 'translate-x-0' ve 'translate-y-[2px]' ile tam ortaya alındı.
        return "h-[78px] w-[78px] translate-x-0 translate-y-[2px] scale-[1.05]";

      default:
        return "h-[60px] w-[60px] translate-x-0 translate-y-0 scale-100";
    }
  };

  const scrollToContentStart = () => {
    if (!contentTopRef.current) return;

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

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollToContentStart();
      });
    });
  };

  return (
    <div className="relative z-10 mx-auto w-full max-w-[1500px] px-6 py-10 md:px-8 md:py-16 xl:px-12">
      <div className="flex flex-col items-start gap-8 lg:flex-row lg:items-stretch lg:gap-16 xl:gap-24">
        {/* Desktop Sidebar */}
        <aside className="relative hidden shrink-0 lg:block lg:w-[220px] xl:w-[240px]">
          <div className="sticky top-32">
            <CategoryFilter
              categories={filterCategories}
              activeCategory={activeCategory}
              onCategoryClick={handleCategoryClick}
              title={filterTitle}
            />

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

        {/* Main Content */}
        <div className="w-full flex-1">
                    {/* Mobile / Tablet Category Icons */}
          <div className="mb-10 lg:hidden">
            <div className="mx-auto max-w-[390px] sm:max-w-none">
              <div className="grid grid-cols-3 gap-x-4 gap-y-5 sm:grid-cols-6 sm:gap-x-5">
                {filterCategories.map((category) => {
                  const isActive = activeCategory === category.id;
                  const asset = getMobileCategoryAsset(category.id);
                  const compactLabel = getCompactMobileLabel(category.id);
                  const imageClass = getMobileCategoryImageClass(category.id);

                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => handleCategoryClick(category.id)}
                      className="flex flex-col items-center justify-start gap-2 text-center"
                    >
                      <span
                        className={`relative flex h-[84px] w-[84px] items-center justify-center overflow-visible rounded-full border-2 transition-all duration-300 sm:h-[94px] sm:w-[94px] ${
                          isActive
                            ? "scale-105 border-primary bg-primary/5 shadow-[6px_6px_16px_rgba(30,28,16,0.14)]"
                            : "border-primary/15 bg-surface_container_highest/75"
                        }`}
                      >
                        <span
                          className="absolute inset-0 rounded-full opacity-100"
                          style={{
                            backgroundImage: `
                              radial-gradient(circle at 50% 50%, rgba(166,0,2,0.16) 0%, rgba(166,0,2,0.08) 18%, transparent 18%),
                              repeating-conic-gradient(
                                from 0deg at 50% 50%,
                                rgba(166,0,2,0.13) 0deg 11deg,
                                transparent 11deg 22deg
                              )
                            `,
                          }}
                        />

                        <Image
                          src={asset}
                          alt={category.label}
                          width={96}
                          height={96}
                          className={`relative z-10 object-contain drop-shadow-[0_10px_16px_rgba(0,0,0,0.20)] transition-all duration-300 ${imageClass} ${
                            isActive ? "opacity-100" : "opacity-90"
                          }`}
                        />
                      </span>

                      <span
                        className={`font-display text-[0.72rem] font-black uppercase leading-tight tracking-wider ${
                          isActive ? "text-primary" : "text-on_surface/75"
                        }`}
                      >
                        {compactLabel}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div ref={contentTopRef} className="mx-auto w-full max-w-[1080px]">
            <div className="flex flex-col gap-14 md:gap-16 lg:gap-24">
              {visibleCategories.map((category) => (
                <section key={category.id} id={category.id} className="min-h-[200px]">
                  <h2 className="inline-block font-display text-3xl font-black uppercase tracking-tighter text-on_surface md:text-4xl lg:text-5xl">
                    {category.name}
                    <div className="mt-2 h-2.5 w-full bg-primary" />
                  </h2>

                  {category.items.length > 0 ? (
                    <>
                      {/* Mobile / Tablet Accordion Layout */}
                      <div className="mt-6 lg:hidden">
                        <LayoutGroup id={`mobile-category-${category.id}`}>
                          <div className="flex flex-col gap-4">
                            {category.items.map((item) => (
                              <MobileProductAccordion
                                key={item.id}
                                imageSrc={item.image}
                                imageAlt={item.name}
                                name={item.name}
                                price={`₺${item.price}`}
                                description={item.description}
                              />
                            ))}
                          </div>
                        </LayoutGroup>
                      </div>

                      {/* Desktop Grid Layout - untouched in spirit */}
                      <div className="mt-8 hidden grid-cols-1 gap-8 md:grid-cols-2 lg:grid lg:grid-cols-3 lg:gap-10">
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
                    </>
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