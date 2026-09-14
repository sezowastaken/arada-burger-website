"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdminLang } from "./AdminLanguageProvider";
import type { AdminCopy } from "@/lib/adminI18n";

interface NavItem {
  href: string;
  label: (t: AdminCopy) => string;
}

interface NavSection {
  title?: (t: AdminCopy) => string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  { items: [{ href: "/admin", label: (t) => t.nav.dashboard }] },
  {
    title: (t) => t.nav.sectionMenu,
    items: [
      { href: "/admin/products", label: (t) => t.nav.products },
      { href: "/admin/categories", label: (t) => t.nav.categories },
    ],
  },
  {
    title: (t) => t.nav.sectionOperations,
    items: [
      { href: "/admin/orders", label: (t) => t.nav.orders },
      { href: "/admin/inventory", label: (t) => t.nav.inventory },
      { href: "/admin/analytics", label: (t) => t.nav.analytics },
    ],
  },
  { items: [{ href: "/admin/settings", label: (t) => t.nav.settings }] },
];

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

/**
 * Navigation body, shared by the desktop rail and the mobile drawer so the two
 * can never drift apart.
 *
 * Ketchup red is unreadable on the ink ground (1.77:1), so "you are here" is
 * marked by inverting to paper instead — the brand's own Ink-on-Paper contrast.
 */
export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { t } = useAdminLang();

  return (
    <nav className="flex flex-col gap-6 px-3 py-4">
      {NAV_SECTIONS.map((section, index) => (
        <div key={index} className="flex flex-col gap-1">
          {section.title ? (
            <h2 className="px-3 pb-1 text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-background/35">
              {section.title(t)}
            </h2>
          ) : null}

          {section.items.map((item) => {
            const active = isActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={`rounded-[10px] px-3 py-2 text-sm font-semibold transition-[background-color,color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background/70 ${
                  active
                    ? "bg-background text-on_surface"
                    : "text-background/60 hover:bg-background/10 hover:text-background"
                }`}
              >
                {item.label(t)}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

export function SidebarWordmark() {
  const { t } = useAdminLang();

  return (
    <div className="px-6 py-5">
      {/* The one place the poster face is allowed: identity, not UI. */}
      <p className="font-display text-lg font-black uppercase leading-none tracking-tight text-background">
        Arada
      </p>
      <p className="mt-1 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-background/45">
        {t.header.subtitle}
      </p>
    </div>
  );
}
