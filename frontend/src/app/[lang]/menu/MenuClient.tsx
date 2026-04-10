"use client";

import React, { useState, useEffect } from "react";
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
}

export default function MenuClient({ categories, filterTitle }: MenuClientProps) {
  const [activeCategory, setActiveCategory] = useState<string>(categories[0]?.id || "");

  const handleCategoryClick = (id: string) => {
    setActiveCategory(id);

    const element = document.getElementById(id);
    if (element) {
      const yOffset = -120;
      const y = element.getBoundingClientRect().top + window.scrollY + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const categoryElements = categories.map((cat) => document.getElementById(cat.id));
      let currentActive = activeCategory;

      for (const el of categoryElements) {
        if (!el) continue;

        const rect = el.getBoundingClientRect();
        if (rect.top <= 250 && rect.bottom >= 250) {
          currentActive = el.id;
        }
      }

      if (currentActive !== activeCategory) {
        setActiveCategory(currentActive);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [activeCategory, categories]);

  const filterCategories = categories.map((c) => ({
    id: c.id,
    label: c.name,
  }));

  return (
    <div className="container mx-auto px-4 py-8 md:py-16 relative z-10 w-full max-w-[1600px]">
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-start">
        {/* Sidebar Wrapper - Explicit Non-Sticky */}
        <div className="w-full lg:w-1/5 xl:w-[15%] hidden lg:block static relative self-auto z-20">
          <CategoryFilter
            categories={filterCategories}
            activeCategory={activeCategory}
            onCategoryClick={handleCategoryClick}
            title={filterTitle}
          />

          {/* Sol taraftaki maskot */}
          <div className="absolute -left-12 xl:-left-24 top-[60vh] w-40 h-40 md:w-64 md:h-64 transition-transform duration-300 ease-in-out hover:scale-110 hover:rotate-3 opacity-90 z-30 pointer-events-auto">
            <Image
              src="/brand/mascots/soda_maskot.png"
              alt="Soda Mascot"
              width={300}
              height={300}
              className="w-full h-auto drop-shadow-xl"
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="w-full lg:w-4/5 xl:w-[85%] flex flex-col gap-16 lg:gap-32">
          {categories.map((category) => (
            <section
              key={category.id}
              id={category.id}
              className="scroll-mt-32 min-h-[200px]"
            >
              <h2 className="font-display font-black text-4xl md:text-6xl uppercase tracking-tighter mb-8 text-on_surface inline-block">
                {category.name}
                <div className="h-3 w-full bg-primary mt-2"></div>
              </h2>

              {category.items.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
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
                <div className="p-12 border-4 border-dashed border-on_surface/10 rounded-3xl text-center text-on_surface/30 font-display font-bold uppercase tracking-widest">
                  Yakında Gelecek...
                </div>
              )}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}