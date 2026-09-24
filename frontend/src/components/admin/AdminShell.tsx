"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdminLang } from "./AdminLanguageProvider";
import { SidebarNav, SidebarWordmark } from "./Sidebar";
import type { AdminLang } from "@/lib/adminI18n";

/**
 * The brand's checkerboard divider, used once, structurally, as the seam
 * between the app chrome and the work surface. It is the only ornament the
 * admin borrows from the public site.
 */
const checkerSvg = `data:image/svg+xml;utf8,<svg width="12" height="12" xmlns="http://www.w3.org/2000/svg"><rect width="6" height="6" fill="%231e1c10" /><rect x="6" y="6" width="6" height="6" fill="%231e1c10" /></svg>`;

/**
 * DESIGN.md specifies the divider as an ink-and-surface tile at 0.7rem. Half
 * that height only shows one row of squares, which reads as a dashed rule
 * rather than a checkerboard, and in red it reads as an alarm.
 */
function CheckerSeam() {
  return (
    <div
      aria-hidden="true"
      className="h-3 w-full opacity-[0.10]"
      style={{ backgroundImage: `url('${checkerSvg}')`, backgroundSize: "12px 12px" }}
    />
  );
}

function LanguageToggle() {
  const { lang, setLang, t } = useAdminLang();
  const options: AdminLang[] = ["tr", "en"];

  return (
    <div
      role="group"
      aria-label={t.header.languageLabel}
      className="inline-flex items-center rounded-full border border-outline_variant bg-surface_container_low p-0.5"
    >
      {options.map((option) => {
        const active = lang === option;

        return (
          <button
            key={option}
            type="button"
            onClick={() => setLang(option)}
            aria-pressed={active}
            className={`rounded-full px-2.5 py-1 text-[0.6875rem] font-bold uppercase tracking-wide transition-[background-color,color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 ${
              active ? "bg-on_surface text-background" : "text-on_surface/50 hover:text-on_surface"
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {open ? (
        <path
          d="M6 6l12 12M18 6L6 18"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M4 7h16M4 12h16M4 17h16"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const { t, lang } = useAdminLang();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // A drawer that survives navigation would cover the page it just opened.
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!drawerOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrawerOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [drawerOpen]);

  return (
    /* Declared so Turkish uppercasing is correct (CSS uppercase maps i→İ only
       under lang="tr") and so a screen reader speaks the right language. */
    <div lang={lang} className="min-h-screen bg-background text-on_surface">
      {/* Desktop rail */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col bg-on_surface lg:flex">
        <SidebarWordmark />
        <div className="flex-1 overflow-y-auto">
          <SidebarNav />
        </div>
        <Link
          href={`/${lang}`}
          className="m-3 rounded-[10px] px-3 py-2 text-[0.8125rem] font-semibold text-background/50 transition-colors duration-150 hover:bg-background/10 hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background/70"
        >
          {t.header.viewSite} ↗
        </Link>
      </aside>

      {/* Mobile drawer */}
      {drawerOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label={t.nav.closeMenu}
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-on_surface/50"
          />
          <div className="absolute inset-y-0 left-0 flex w-64 flex-col bg-on_surface shadow-xl">
            <SidebarWordmark />
            <div className="flex-1 overflow-y-auto">
              <SidebarNav onNavigate={() => setDrawerOpen(false)} />
            </div>
          </div>
        </div>
      ) : null}

      <div className="lg:pl-60">
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur">
          <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
            <button
              type="button"
              onClick={() => setDrawerOpen((open) => !open)}
              aria-label={drawerOpen ? t.nav.closeMenu : t.nav.openMenu}
              aria-expanded={drawerOpen}
              className="-ml-1 inline-flex h-9 w-9 items-center justify-center rounded-[10px] text-on_surface/70 transition-colors duration-150 hover:bg-surface_container_highest hover:text-on_surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary lg:hidden"
            >
              <MenuIcon open={drawerOpen} />
            </button>

            <p className="font-display text-sm font-black uppercase tracking-tight text-on_surface lg:hidden">
              Arada
            </p>

            <div className="ml-auto flex items-center gap-2">
              <LanguageToggle />
            </div>
          </div>
          <CheckerSeam />
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
