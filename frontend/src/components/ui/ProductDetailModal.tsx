"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";

const checkerSvg = `data:image/svg+xml;utf8,<svg width="10" height="10" xmlns="http://www.w3.org/2000/svg"><rect width="5" height="5" fill="%23a60002" /><rect x="5" y="5" width="5" height="5" fill="%23a60002" /></svg>`;
const checkerStyle = {
  backgroundImage: `url('${checkerSvg}')`,
  backgroundSize: "10px 10px",
  backgroundRepeat: "repeat",
};

interface Props {
  imageSrc?: string;
  imageAlt: string;
  name: string;
  price: string;
  description: string;
  isAvailable?: boolean;
  soldOutLabel: string;
  closeLabel: string;
  onClose: () => void;
}

/**
 * Desktop's answer to the mobile accordion.
 *
 * There is no static-grid equivalent of "tap a card to expand it" — the
 * three-column layout has nowhere for a card to grow into. So a click opens
 * this instead: the same photo, at a size the 2:3 card can never afford,
 * with the card's own name/price/description carried along underneath it as
 * a caption rather than the main event. Portaled to `document.body` so a
 * `position: fixed` overlay can't get trapped by a transformed ancestor
 * (several parents in the grid use `hover:` transforms).
 */
export function ProductDetailModal({
  imageSrc = "",
  imageAlt,
  name,
  price,
  description,
  isAvailable = true,
  soldOutLabel,
  closeLabel,
  onClose,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const hasImage = Boolean(imageSrc && imageSrc.trim().length > 0);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      // Same focus-trap shape as AdminModal: without it, Tab walks out of
      // the dialog onto whatever the overlay is covering.
      if (event.key !== "Tab") return;

      const panel = panelRef.current;
      if (!panel) return;

      const focusable = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || active === panel)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-4 sm:p-6">
      <button
        type="button"
        aria-label={closeLabel}
        onClick={onClose}
        className="absolute inset-0 bg-[#1e1c10]/70 backdrop-blur-sm"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={name}
        tabIndex={-1}
        className="relative my-auto w-full max-w-[720px] overflow-hidden rounded-[40px] bg-[#fff9e7] shadow-[0_32px_64px_rgba(30,28,16,0.35)] focus:outline-none"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={closeLabel}
          className="absolute right-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-[#1e1c10] text-[#fff9e7] shadow-[2px_2px_0px_rgba(0,0,0,0.25)] transition-transform duration-150 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fff9e7] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1e1c10]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </button>

        {/* The image, at last given room to actually be looked at — roughly
            60% of the panel's height, the rest is its caption. */}
        <div className="relative h-[52vh] max-h-[520px] min-h-[300px] w-full overflow-hidden bg-[#fff9e7]">
          <div
            className="absolute inset-0 scale-150 opacity-50"
            aria-hidden="true"
            style={{
              backgroundImage:
                "repeating-conic-gradient(from 0deg at 50% 50%, #a60002 0deg 15deg, transparent 15deg 30deg)",
            }}
          />

          {hasImage ? (
            <div
              className={`absolute inset-0 p-8 sm:p-10 ${isAvailable ? "" : "grayscale-[0.85] opacity-40"}`}
            >
              <Image
                src={imageSrc}
                alt={imageAlt}
                fill
                sizes="(min-width: 640px) 720px, 100vw"
                className="object-contain drop-shadow-[0_28px_44px_rgba(0,0,0,0.35)]"
                priority
              />
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="rounded-full border-2 border-[#1e1c10]/10 bg-[#fff9e7]/90 px-8 py-3 font-[family:var(--font-epilogue)] text-lg font-black uppercase tracking-[0.2em] text-[#a60002] shadow-[4px_4px_0px_rgba(30,28,16,0.08)]">
                Arada
              </span>
            </div>
          )}

          {!isAvailable ? (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <span className="-rotate-[9deg] whitespace-nowrap border-[3px] border-double border-[#a60002] bg-[#fff9e7]/85 px-[0.9em] py-[0.5em] font-[family:var(--font-epilogue)] text-[clamp(1rem,2.2vw,1.6rem)] font-black uppercase leading-none tracking-[0.16em] text-[#a60002]">
                {soldOutLabel}
              </span>
            </div>
          ) : null}
        </div>

        {/* Checker Divider — the one ornament the card already earns, reused
            at the same weight rather than invented fresh for this view. */}
        <div className="h-[10px] w-full" style={checkerStyle} />

        <div className="flex flex-col items-center gap-3 px-8 py-8 text-center sm:px-12">
          <h2 className="font-[family:var(--font-epilogue)] text-[clamp(1.75rem,3.5vw,2.5rem)] font-black uppercase leading-[0.95] tracking-tighter text-[#1e1c10]">
            {name}
          </h2>

          <div
            className={`rounded-full px-6 py-1.5 font-[family:var(--font-epilogue)] text-xl font-black ${
              isAvailable
                ? "bg-[#f2a11a] text-[#a60002] shadow-[2px_2px_0px_#1e1c10]"
                : "bg-[#e8e2cf] text-[#1e1c10]/65"
            }`}
          >
            {price}
          </div>

          <p className="max-w-[52ch] font-[family:var(--font-manrope)] text-[0.9375rem] font-semibold leading-relaxed text-[#1e1c10]/80">
            {description}
          </p>
        </div>
      </div>
    </div>,
    document.body,
  );
}
