"use client";

import { useState } from "react";
import Image from "next/image";

type MobileProductAccordionProps = {
  imageSrc?: string;
  imageAlt: string;
  name: string;
  price: string;
  description: string;
  className?: string;
};

export default function MobileProductAccordion({
  imageSrc = "",
  imageAlt,
  name,
  price,
  description,
  className = "",
}: MobileProductAccordionProps) {
  const [open, setOpen] = useState(false);
  const hasImage = Boolean(imageSrc && imageSrc.trim().length > 0);

  return (
    <article
      className={`overflow-hidden rounded-[2rem] border border-on_surface/10 bg-background/95 shadow-[6px_6px_20px_rgba(30,28,16,0.10)] backdrop-blur-sm ${className}`}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="block w-full text-left"
      >
        <div className="grid grid-cols-[92px_minmax(0,1fr)_auto] items-center gap-4 p-4 sm:grid-cols-[110px_minmax(0,1fr)_auto] sm:p-5">
          {/* Visual */}
          <div className="relative h-[92px] w-[92px] overflow-hidden rounded-[1.5rem] bg-surface_container_highest sm:h-[110px] sm:w-[110px]">
            <div
              className="absolute inset-0 opacity-70"
              style={{
                backgroundImage: `
                  radial-gradient(circle at 20% 20%, rgba(166,0,2,0.16) 0, transparent 42%),
                  repeating-linear-gradient(
                    45deg,
                    rgba(166,0,2,0.08) 0px,
                    rgba(166,0,2,0.08) 10px,
                    transparent 10px,
                    transparent 20px
                  )
                `,
              }}
            />

            {hasImage ? (
              <div className="relative z-10 h-full w-full">
                <Image
                  src={imageSrc}
                  alt={imageAlt}
                  fill
                  className="object-contain p-2 drop-shadow-[0_12px_20px_rgba(0,0,0,0.22)]"
                />
              </div>
            ) : (
              <div className="relative z-10 flex h-full w-full items-center justify-center">
                <span className="rounded-full bg-primary px-3 py-1 font-display text-xs font-black uppercase tracking-widest text-white">
                  Arada
                </span>
              </div>
            )}
          </div>

          {/* Text */}
          <div className="min-w-0">
            <h3 className="font-display text-lg font-black uppercase leading-none tracking-tight text-on_surface sm:text-xl">
              {name}
            </h3>

            <p className="mt-2 line-clamp-2 font-[family:var(--font-manrope)] text-sm font-bold leading-snug text-on_surface/65">
              {description}
            </p>
          </div>

          {/* Price + Chevron */}
          <div className="ml-2 flex h-full flex-col items-end justify-between gap-3">
            <span className="whitespace-nowrap rounded-full bg-[#f2a11a] px-4 py-1 font-display text-sm font-black text-primary shadow-[2px_2px_0px_#1e1c10] sm:text-base">
              {price}
            </span>

            <span
              className={`flex h-9 w-9 items-center justify-center rounded-full border-2 border-primary/20 bg-surface_container_highest text-primary transition-transform duration-300 ${
                open ? "rotate-180" : ""
              }`}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M6 9L12 15L18 9"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </div>
        </div>
      </button>

      {/* Expandable Detail */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-out ${
          open ? "max-h-[520px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-4 pb-4 sm:px-5 sm:pb-5">
          {/* Divider */}
          <div
            className="h-[12px] w-full opacity-90"
            style={{
              backgroundImage: `
                linear-gradient(45deg, #a60002 25%, transparent 25%), 
                linear-gradient(-45deg, #a60002 25%, transparent 25%), 
                linear-gradient(45deg, transparent 75%, #a60002 75%), 
                linear-gradient(-45deg, transparent 75%, #a60002 75%)
              `,
              backgroundSize: "10px 10px",
              backgroundPosition: "0 0, 0 5px, 5px -5px, -5px 0px",
            }}
          />

          <div className="mt-4 rounded-[1.75rem] bg-surface_container_highest/80 p-4">
            <div className="relative mb-4 aspect-[16/10] w-full overflow-hidden rounded-[1.5rem] bg-background">
              <div
                className="absolute inset-0 opacity-65"
                style={{
                  backgroundImage: `
                    radial-gradient(circle at 30% 30%, rgba(166,0,2,0.16) 0, transparent 38%),
                    repeating-conic-gradient(
                      from 0deg at 50% 50%,
                      rgba(166,0,2,0.08) 0deg 14deg,
                      transparent 14deg 28deg
                    )
                  `,
                }}
              />

              {hasImage ? (
                <Image
                  src={imageSrc}
                  alt={imageAlt}
                  fill
                  className="object-contain p-4 drop-shadow-[0_20px_28px_rgba(0,0,0,0.25)]"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <span className="rounded-full bg-primary px-4 py-2 font-display text-sm font-black uppercase tracking-widest text-white">
                    Arada
                  </span>
                </div>
              )}
            </div>

            <p className="font-[family:var(--font-manrope)] text-sm font-bold leading-relaxed text-on_surface/80">
              {description}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}