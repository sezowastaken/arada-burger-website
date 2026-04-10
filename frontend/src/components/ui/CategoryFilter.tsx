"use client";

import React from "react";

export interface Category {
  id: string;
  label: string;
}

interface CategoryFilterProps {
  categories: Category[];
  activeCategory: string;
  onCategoryClick: (id: string) => void;
  title: string;
}

export default function CategoryFilter({
  categories,
  activeCategory,
  onCategoryClick,
  title,
}: CategoryFilterProps) {
  return (
    <div className="w-full rounded-[1.75rem] border-4 border-dashed border-on_surface/15 
    bg-background/95 p-5 shadow-[6px_6px_20px_rgba(30,28,16,0.08)] backdrop-blur-sm xl:p-6">
      {/* 
        ISLAND BOYUTUNU KÜÇÜLTMEK:
        - p-5 / xl:p-6 => iç boşluk
        - rounded-[1.75rem] => köşe yuvarlaklığı
      */}
      <h3 className="mb-6 inline-block border-b-4 border-primary pb-2 font-display 
      text-xl font-black uppercase tracking-widest text-on_surface xl:mb-7 xl:text-2xl">
        {title}
      </h3>

      {/* 
        BUTONLAR ARASI MESAFE:
        - gap-3 / xl:gap-4
      */}
      <ul className="flex flex-col gap-3 xl:gap-4">
        {categories.map((category) => {
          const isActive = activeCategory === category.id;

          return (
            <li key={category.id}>
              <button
                type="button"
                onClick={() => onCategoryClick(category.id)}
                className={`w-full rounded-[1.5rem] border-2 px-5 py-3 text-left font-display text-base 
                  font-bold uppercase tracking-wide transition-all xl:px-6 xl:py-4 xl:text-md ${isActive
                    ? "translate-x-2 border-primary bg-primary text-white sticker-shadow"
                    : "border-primary/10 bg-surface_container_highest text-on_surface hover:translate-x-1 hover:border-primary"
                  }`}
              >
                {category.label}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}