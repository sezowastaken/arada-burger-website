"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useAdminLang } from "./AdminLanguageProvider";

/**
 * One dialog shell for the whole panel: same chrome, same dismissal, same
 * keyboard behaviour everywhere. Rendered fixed to the viewport so it can never
 * be clipped by a scrolling table wrapper.
 */
export function AdminModal({
  title,
  subtitle,
  onClose,
  children,
  width = "md",
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  width?: "sm" | "md" | "lg";
}) {
  const { t } = useAdminLang();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      // aria-modal claims the page behind is inert; without this, Tab walks
      // straight out of the dialog onto controls the overlay has covered.
      if (event.key !== "Tab") return;

      const panel = panelRef.current;
      if (!panel) return;

      const focusable = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
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
      // Send focus back where it came from, so keyboard users are not dropped
      // at the top of the document after closing.
      previouslyFocused?.focus?.();
    };
  }, [onClose]);

  const maxWidth = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl" }[width];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
      <button
        type="button"
        aria-label={t.common.close}
        onClick={onClose}
        className="absolute inset-0 bg-on_surface/45 backdrop-blur-[2px]"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`relative my-8 w-full ${maxWidth} rounded-[16px] border border-outline_variant bg-surface_container_lowest shadow-[0_24px_48px_rgba(30,28,16,0.22)] focus:outline-none`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-outline_variant px-5 py-4">
          <div>
            <h2 className="text-base font-bold tracking-tight text-on_surface">{title}</h2>
            {subtitle ? (
              <p className="mt-0.5 text-[0.8125rem] text-on_surface/55">{subtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.common.close}
            className="-mr-1 -mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-on_surface/45 transition-colors duration-150 hover:bg-surface_container_low hover:text-on_surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}
