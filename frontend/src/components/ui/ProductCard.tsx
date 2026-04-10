"use client";

import Image from "next/image";

type ProductCardProps = {
  imageSrc?: string;
  imageAlt: string;
  name: string;
  price: string;
  description: string;
  className?: string;
};

export default function ProductCard({
  imageSrc = "",
  imageAlt,
  name,
  price,
  description,
  className = "",
}: ProductCardProps) {
  const hasImage = Boolean(imageSrc && imageSrc.trim().length > 0);

  return (
    <article
      className={`group relative flex aspect-[2/3] w-full max-w-[450px] flex-col overflow-hidden rounded-[48px] shadow-[6px_6px_20px_rgba(30,28,16,0.15)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[12px_12px_32px_rgba(30,28,16,0.25)] ${className}`}
    >
      {/* Frame Background */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/vintage_frame_2.png"
          alt="Card Frame Background"
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Content Layer */}
      <div className="relative z-10 flex h-full flex-col px-12 py-16">
        {/* Visual Area */}
        <div className="relative h-[50%] w-full">
          <div className="absolute inset-0 mx-2 overflow-hidden rounded-[40px] border border-[#1e1c10]/5">
            <div
              className="absolute inset-0 z-0 scale-150 opacity-70"
              style={{
                backgroundImage: `
                  repeating-conic-gradient(
                    from 0deg at 50% 50%,
                    #a60002 0deg 15deg,
                    transparent 15deg 30deg
                  )
                `,
              }}
            />
          </div>

          {hasImage ? (
            <div className="relative z-10 h-full w-full transition-transform duration-500 group-hover:scale-125">
              <Image
                src={imageSrc}
                alt={imageAlt}
                fill
                className="object-contain drop-shadow-[0_25px_40px_rgba(0,0,0,0.35)]"
              />
            </div>
          ) : (
            <div className="relative z-10 flex h-full w-full items-center justify-center">
              <span className="rounded-full border-2 border-[#1e1c10]/10 bg-[#fff9e7]/90 px-8 py-3 font-[family:var(--font-epilogue)] text-lg font-black uppercase tracking-[0.2em] text-[#a60002] shadow-[4px_4px_0px_rgba(30,28,16,0.08)]">
                Arada
              </span>
            </div>
          )}
        </div>

        {/* Checker Divider */}
        <div className="relative z-20 my-6 h-[14px] w-full bg-transparent">
          <div
            className="h-full w-full opacity-90"
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
        </div>

        {/* Text Area */}
        <div className="relative z-20 flex flex-1 flex-col items-center justify-start text-center">
          <h3 className="font-[family:var(--font-epilogue)] text-[clamp(1.5rem,1.8vw,2rem)] font-black uppercase leading-none tracking-tighter text-[#1e1c10]">
            {name}
          </h3>

          <div className="mt-4 rounded-full bg-[#f2a11a] px-6 py-1 font-[family:var(--font-epilogue)] text-[1.2rem] font-black text-[#a60002] shadow-[2px_2px_0px_#1e1c10]">
            {price}
          </div>

          <p className="mt-5 line-clamp-3 font-[family:var(--font-manrope)] text-[0.85rem] font-bold leading-tight text-[#1e1c10]/80">
            {description}
          </p>
        </div>
      </div>

      {/* Grain Overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-30 opacity-[0.04] mix-blend-multiply"
        style={{
          backgroundImage:
            'url("https://www.transparenttextures.com/patterns/stardust.png")',
        }}
      />
    </article>
  );
}