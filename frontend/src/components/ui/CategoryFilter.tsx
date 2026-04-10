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
    <div className="w-full static bg-background border-r-4 border-dashed border-on_surface/20 p-6 rounded-xl">
      <h3 className="font-display font-black text-2xl uppercase mb-8 text-on_surface tracking-widest border-b-4 border-primary pb-2 inline-block">
        {title}
      </h3>

      <ul className="flex flex-col gap-4">
        {categories.map((category) => {
          const isActive = activeCategory === category.id;

          return (
            <li key={category.id}>
              <button
                type="button"
                onClick={() => onCategoryClick(category.id)}
                className={`w-full text-left font-display font-bold text-lg uppercase tracking-wide py-4 px-6 transition-all rounded-xl border-2 ${
                  isActive
                    ? "bg-primary text-white border-primary translate-x-2 sticker-shadow"
                    : "bg-surface_container_highest text-on_surface border-primary/10 hover:border-primary hover:translate-x-1"
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