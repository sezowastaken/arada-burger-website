"use client";

import React, { useMemo, useRef, useState } from "react";
import Image from "next/image";
import CategoryFilter from "@/components/ui/CategoryFilter";
import ProductCard from "@/components/ui/ProductCard";
import MobileProductAccordion from "@/components/ui/MobileProductAccordion";

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
          {/* Mobile / Tablet Category Pills */}
          <div className="mb-8 lg:hidden">
            <div className="-mx-6 overflow-x-auto px-6 md:-mx-8 md:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex w-max gap-3 pb-2">
                {filterCategories.map((category) => {
                  const isActive = activeCategory === category.id;

                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => handleCategoryClick(category.id)}
                      className={`rounded-full border-2 px-4 py-2 font-display text-sm font-black uppercase tracking-wide transition-all ${
                        isActive
                          ? "border-primary bg-primary text-white shadow-[4px_4px_12px_rgba(30,28,16,0.12)]"
                          : "border-primary/10 bg-surface_container_highest text-on_surface"
                      }`}
                    >
                      {category.label}
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
                      <div className="mt-6 flex flex-col gap-4 lg:hidden">
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