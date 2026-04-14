"use client";

import { useId, useState, useEffect } from "react";
import Image from "next/image";
import {
  AnimatePresence,
  motion,
  type Transition,
} from "framer-motion";

type MobileProductAccordionProps = {
  imageSrc?: string;
  imageAlt: string;
  name: string;
  price: string;
  description: string;
  className?: string;
};

// "PowerPoint Morph" tadında sürtünmesiz organik yay fiziği:
const layoutTransition: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
  mass: 0.6,
};

const checkerSvg = `data:image/svg+xml;utf8,<svg width="10" height="10" xmlns="http://www.w3.org/2000/svg"><rect width="5" height="5" fill="%23a60002" /><rect x="5" y="5" width="5" height="5" fill="%23a60002" /></svg>`;
const checkerStyle = {
  backgroundImage: `url('${checkerSvg}')`,
  backgroundSize: "10px 10px",
  backgroundRepeat: "repeat",
};

const starburstStyle = {
  backgroundImage: `
    radial-gradient(circle at 50% 50%, rgba(166,0,2,0.18) 0%, rgba(166,0,2,0.09) 20%, transparent 20%),
    repeating-conic-gradient(
      from 0deg at 50% 50%,
      rgba(166,0,2,0.16) 0deg 10deg,
      transparent 10deg 20deg
    )
  `,
};

function MobileProductAccordion({
  imageSrc = "",
  imageAlt,
  name,
  price,
  description,
  className = "",
}: MobileProductAccordionProps) {
  const [open, setOpen] = useState(false);
  const uid = useId();

  // Modal açıkken arkadaki body'nin kaymasını engelle:
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const hasImage = Boolean(imageSrc && imageSrc.trim().length > 0);

  // Ortak Animasyon ID'leri (Shared Component LayoutIds):
  const ids = {
    container: `container-${uid}`,
    imageWrapper: `img-wrapper-${uid}`,
    title: `title-${uid}`,
    price: `price-${uid}`,
    chevron: `chevron-${uid}`,
  };

  /**
   * BORDER RADIUS SCALE CORRECTION:
   * Framer Motion layout/layoutId ile boyut anime ederken
   * border-radius objelerinin CSS classları üzerinden değil, 
   * sayısal (number) olarak verilmesi şarttır. (örn: 32)
   */
  const BASE_RADIUS = 32;       // 2rem (32px)
  const IMG_RADIUS_COMPACT = 24;  // 1.5rem (24px)
  const IMG_RADIUS_EXPANDED = 30; // 1.9rem (30px)

  return (
    <>
      <div className={`relative ${className}`}>
        {open ? (
          // PLACEHOLDER: Compact kart havaya kalktığında arkada kalan listenin çökmesini engeller
          <div className="h-[138px] w-full sm:h-[154px]" aria-hidden />
        ) : (
          /* COMPACT CARD (Kapalı Liste Durumu) */
          <motion.article
            layoutId={ids.container}
            transition={layoutTransition}
            style={{
              borderRadius: BASE_RADIUS,
              boxShadow: "6px 6px 16px rgba(0,0,0,0.08)"
            }}
            className="overflow-hidden border border-on_surface/10 bg-background/95 backdrop-blur-sm"
          >
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-expanded={false}
              className="flex w-full items-center gap-x-5 p-4 text-left sm:p-5"
            >
              {/* IMAGE WRAPPER (Compact) */}
              <motion.div
                layoutId={ids.imageWrapper}
                transition={layoutTransition}
                style={{ borderRadius: IMG_RADIUS_COMPACT }}
                className="relative h-[104px] w-[140px] shrink-0 overflow-visible sm:h-[112px] sm:w-[150px]"
              >
                <div className="absolute inset-0 overflow-hidden" style={{ borderRadius: IMG_RADIUS_COMPACT }}>
                  <div className="absolute inset-0" style={starburstStyle} />
                </div>
                {hasImage ? (
                  <div className="absolute inset-0 z-10 flex items-center justify-center overflow-visible">
                    <Image
                      src={imageSrc}
                      alt={imageAlt}
                      fill
                      className="scale-[1.30] -translate-x-[2px] object-contain drop-shadow-[0_18px_20px_rgba(0,0,0,0.20)]"
                    />
                  </div>
                ) : (
                  <div className="absolute inset-0 z-10 flex items-center justify-center">
                    <span className="rounded-full bg-primary px-4 py-1 font-display text-xs font-black uppercase tracking-widest text-white">Arada</span>
                  </div>
                )}
              </motion.div>

              {/* CONTENT WRAPPER (Compact) */}
              <div className="flex min-w-0 flex-1 mt-1 flex-col justify-center gap-3">
                {/*
                  EDIT GUIDE:
                  ProductAccordion kapaliyken urun isminin top/bottom boslugunu
                  bu h3'e `mt-*` ve `mb-*` Tailwind class'lari ekleyerek degistirebilirsin.
                  Ornek: `className="... mt-1 mb-2"` gibi.

                  Not:
                  - Sadece urun isminin kendi ust/alt boslugunu degistirmek istiyorsan `h3`u duzenle.
                  - Ustten kirpilma varsa margin yerine once `pt-*` dene; padding metni kutunun
                    icinde asagi iter, margin ise dis bosluk ekler.
                  - Isim ile alttaki fiyat/ikon blogu arasindaki genel dikey mesafeyi
                    degistirmek istiyorsan bu wrapper'daki `gap-3` degerini degistir.
                */}
                <motion.h3
                  layoutId={ids.title}
                  transition={layoutTransition}
                  style={{ transformOrigin: "left center" }} // GPU ivmelenmeli smooth koruma
                  className="line-clamp-2 pt-0.4 font-display text-[1.85rem] font-black uppercase leading-[0.92] tracking-tight text-on_surface sm:text-[2rem]"
                >
                  {name}
                </motion.h3>

                <div className="flex w-full shrink-0 items-center justify-end gap-3">
                  <motion.span
                    layoutId={ids.price}
                    transition={layoutTransition}
                    className="whitespace-nowrap rounded-full bg-[#f2a11a] px-4 py-1.5 font-display text-base font-black text-primary shadow-[2px_2px_0px_#1e1c10] sm:text-[1.05rem]"
                  >
                    {price}
                  </motion.span>

                  <motion.span
                    layoutId={ids.chevron}
                    transition={layoutTransition}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-primary/20 bg-surface_container_highest text-primary"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </motion.span>
                </div>
              </div>
            </button>
          </motion.article>
        )}
      </div>

      {/* EXPANDED CARD MODAL OVERLAY */}
      {/* Isolation from layout thrashing: Fixed position overlay out of DOM flow */}
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-8">
            {/* Backdrop Ovelay - Tıklandığında Anında Kapatır */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }} // Hızlı exit performansı (stutter'ı kırar)
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />

            {/* Modal Content */}
            <motion.article
              layoutId={ids.container}
              transition={layoutTransition}
              style={{
                borderRadius: BASE_RADIUS,
                boxShadow: "0 24px 48px rgba(0,0,0,0.5)"
              }}
              className="relative w-full max-w-[420px] overflow-hidden border border-on_surface/10 bg-background/95 backdrop-blur-md"
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-expanded={true}
                className="block w-full text-left"
              >
                <div className="flex flex-col gap-4 p-5 sm:p-6">

                  {/* IMAGE WRAPPER (Expanded) */}
                  <motion.div
                    layoutId={ids.imageWrapper}
                    transition={layoutTransition}
                    style={{ borderRadius: IMG_RADIUS_EXPANDED }}
                    className="relative h-[220px] w-full shrink-0 overflow-visible sm:h-[260px]"
                  >
                    <div className="absolute inset-0 overflow-hidden" style={{ borderRadius: IMG_RADIUS_EXPANDED }}>
                      <div className="absolute inset-0" style={starburstStyle} />
                    </div>
                    {hasImage ? (
                      <div className="absolute inset-0 z-10 flex items-center justify-center overflow-visible">
                        <Image
                          src={imageSrc}
                          alt={imageAlt}
                          fill
                          className="scale-[1.08] object-contain p-3 drop-shadow-[0_24px_36px_rgba(0,0,0,0.4)]"
                        />
                      </div>
                    ) : (
                      <div className="absolute inset-0 z-10 flex items-center justify-center">
                        <span className="rounded-full bg-primary px-4 py-1 font-display text-xs font-black uppercase tracking-widest text-white">Arada</span>
                      </div>
                    )}
                  </motion.div>

                  {/* CONTENT WRAPPER (Expanded) */}
                  <div className="flex min-w-0 flex-1 w-full flex-row items-start justify-between">
                    <div className="pr-1">
                      <motion.h3
                        layoutId={ids.title}
                        transition={layoutTransition}
                        style={{ transformOrigin: "left center" }} // Distorsiyonsuz GPU base typography scale 
                        className="font-display text-[2rem] font-black uppercase leading-[0.95] tracking-tight text-on_surface sm:text-[2.2rem]"
                      >
                        {name}
                      </motion.h3>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      <motion.span
                        layoutId={ids.price}
                        transition={layoutTransition}
                        className="whitespace-nowrap rounded-full bg-[#f2a11a] px-4 py-1.5 font-display text-base font-black text-primary shadow-[2px_2px_0px_#1e1c10] sm:text-[1.05rem]"
                      >
                        {price}
                      </motion.span>

                      <motion.span
                        layoutId={ids.chevron}
                        transition={layoutTransition}
                        animate={{ rotate: 180 }}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-primary/20 bg-surface_container_highest text-primary"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </motion.span>
                    </div>
                  </div>

                  {/* DESCRIPTION & SEPARATOR */}
                  {/* Animasyondan hemen sonra belirmesi için delay ve çok hızlı (duration: 0.05) exit stratejisi */}
                  {/* Exit hızlı olmazsa "ExpandedContainer" kapanırken daralma sırasında içeriğin taşmasına ve stutter kasmasına yol açar */}
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, transition: { duration: 0.05 } }}
                    transition={{ delay: 0.15, duration: 0.2 }}
                  >
                    <div className="h-[10px] w-full opacity-95" style={checkerStyle} />
                    <div className="mb-1 mt-4 rounded-[1.5rem] bg-surface_container_highest/85 p-4">
                      <p className="font-[family:var(--font-manrope)] text-[1rem] font-bold leading-relaxed text-on_surface/80">
                        {description}
                      </p>
                    </div>
                  </motion.div>
                </div>
              </button>
            </motion.article>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

export default MobileProductAccordion;
