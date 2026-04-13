"use client";

import { useId, useState } from "react";
import Image from "next/image";
import {
  AnimatePresence,
  LayoutGroup,
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

const layoutTransition: Transition = {
  duration: 0.52,
  ease: "easeInOut",
};

const sharedTransition: Transition = {
  duration: 0.44,
  ease: "easeInOut",
};

const contentFade: Transition = {
  duration: 0.3,
  ease: "easeOut",
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
  const uid = useId();

  const priceId = `price-${uid}`;
  const chevronId = `chevron-${uid}`;

  return (
    <LayoutGroup id={`mobile-accordion-${uid}`}>
      <motion.article
        layout
        transition={{ layout: layoutTransition }}
        style={{
          borderRadius: "2rem",
          boxShadow: "6px 6px 20px rgba(30,28,16,0.10)",
        }}
        className={`overflow-hidden border border-on_surface/10 bg-background/95 backdrop-blur-sm ${className}`}
      >
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          className="block w-full text-left"
        >
          <motion.div
            layout
            transition={{ layout: layoutTransition }}
            className="p-4 sm:p-5"
          >
            <div
              className={`grid items-start gap-4 ${
                open
                  ? "grid-cols-1"
                  : "grid-cols-[140px_minmax(0,1fr)] gap-x-7 sm:grid-cols-[150px_minmax(0,1fr)]"
              }`}
            >
              {/* IMAGE */}
              <motion.div
                layout
                transition={{ layout: layoutTransition }}
                style={{
                  borderRadius: open ? "1.9rem" : "1.5rem",
                }}
                className={`relative overflow-visible bg-surface_container_highest/90 ${
                  open
                    ? "h-[240px] w-full sm:h-[280px]"
                    : "h-[104px] w-[140px] sm:h-[112px] sm:w-[150px]"
                }`}
              >
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ borderRadius: open ? "1.9rem" : "1.5rem" }}
                >
                  <div
                    className="absolute inset-0 opacity-100"
                    style={{
                      backgroundImage: `
                        radial-gradient(circle at 50% 50%, rgba(166,0,2,0.18) 0%, rgba(166,0,2,0.09) 20%, transparent 20%),
                        repeating-conic-gradient(
                          from 0deg at 50% 50%,
                          rgba(166,0,2,0.16) 0deg 10deg,
                          transparent 10deg 20deg
                        )
                      `,
                    }}
                  />
                </div>

                {hasImage ? (
                  <motion.div
                    layout
                    transition={{ layout: layoutTransition }}
                    className="absolute inset-0 z-10 overflow-visible"
                  >
                    <Image
                      src={imageSrc}
                      alt={imageAlt}
                      fill
                      className={`object-contain drop-shadow-[0_18px_28px_rgba(0,0,0,0.26)] transition-all duration-500 ease-in-out ${
                        open
                          ? "scale-[1.08] p-3"
                          : "scale-[1.34] translate-x-3 translate-y-1"
                      }`}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    layout
                    transition={{ layout: layoutTransition }}
                    className="absolute inset-0 z-10 flex items-center justify-center"
                  >
                    <span className="rounded-full bg-primary px-4 py-1 font-display text-xs font-black uppercase tracking-widest text-white">
                      Arada
                    </span>
                  </motion.div>
                )}
              </motion.div>

              {/* CONTENT */}
              <motion.div
                layout="position"
                transition={{ layout: layoutTransition }}
                className="min-w-0"
              >
                {/* OPEN STATE HEADER */}
                {open ? (
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 overflow-hidden pr-1">
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.h3
                          key="title-open"
                          initial={{ x: 18, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          exit={{ x: -18, opacity: 0 }}
                          transition={contentFade}
                          className="font-display text-[2rem] font-black uppercase leading-[0.95] tracking-tight text-on_surface sm:text-[2.2rem]"
                        >
                          {name}
                        </motion.h3>
                      </AnimatePresence>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      <motion.span
                        layoutId={priceId}
                        transition={sharedTransition}
                        className="whitespace-nowrap rounded-full bg-[#f2a11a] px-4 py-1.5 font-display text-base font-black text-primary shadow-[2px_2px_0px_#1e1c10] sm:text-[1.05rem]"
                      >
                        {price}
                      </motion.span>

                      <motion.span
                        layoutId={chevronId}
                        transition={sharedTransition}
                        className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary/20 bg-surface_container_highest text-primary"
                        animate={{ rotate: 180 }}
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
                      </motion.span>
                    </div>
                  </div>
                ) : (
                  <div className="min-w-0">
                    <div className="overflow-hidden">
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.h3
                          key="title-closed"
                          initial={{ x: -18, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          exit={{ x: 18, opacity: 0 }}
                          transition={contentFade}
                          className="line-clamp-2 font-display text-[1.9rem] font-black uppercase leading-[0.92] tracking-tight text-on_surface sm:text-[2.05rem]"
                        >
                          {name}
                        </motion.h3>
                      </AnimatePresence>
                    </div>

                    <motion.div
                      layout="position"
                      transition={{ layout: layoutTransition }}
                      className="mt-4 flex items-center justify-end gap-3"
                    >
                      <motion.span
                        layoutId={priceId}
                        transition={sharedTransition}
                        className="whitespace-nowrap rounded-full bg-[#f2a11a] px-4 py-1.5 font-display text-base font-black text-primary shadow-[2px_2px_0px_#1e1c10] sm:text-[1.05rem]"
                      >
                        {price}
                      </motion.span>

                      <motion.span
                        layoutId={chevronId}
                        transition={sharedTransition}
                        className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary/20 bg-surface_container_highest text-primary"
                        animate={{ rotate: 0 }}
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
                      </motion.span>
                    </motion.div>
                  </div>
                )}
              </motion.div>
            </div>

            {/* OPEN STATE EXTRA CONTENT */}
            <AnimatePresence initial={false}>
              {open && (
                <motion.div
                  key="details"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.34, ease: "easeOut", delay: 0.08 }}
                  className="mt-4"
                >
                  <div
                    className="h-[12px] w-full opacity-95"
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

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.32, ease: "easeOut", delay: 0.12 }}
                    className="mt-4 rounded-[1.5rem] bg-surface_container_highest/85 p-4"
                  >
                    <p className="font-[family:var(--font-manrope)] text-[1rem] font-bold leading-relaxed text-on_surface/80">
                      {description}
                    </p>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </button>
      </motion.article>
    </LayoutGroup>
  );
}