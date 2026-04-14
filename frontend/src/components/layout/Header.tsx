"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useParams } from "next/navigation";

const desktopNavLinks = [
  { href: "/menu", label: { tr: "Menü", en: "Menu" } },
  { href: "/location", label: { tr: "Konum", en: "Location" } },
  { href: "/about", label: { tr: "Hakkımızda", en: "About" } },
];

const mobileNavLinks = [
  { href: "", label: { tr: "Ana Sayfa", en: "Home" } },
  { href: "/menu", label: { tr: "Menü", en: "Menu" } },
  { href: "/location", label: { tr: "Konum", en: "Location" } },
  { href: "/about", label: { tr: "Hakkımızda", en: "About" } },
];

export default function Header({ lang: initialLang }: { lang: "tr" | "en" }) {
  const pathname = usePathname();
  const params = useParams();

  const lang = (params?.lang as "tr" | "en") || initialLang || "tr";

  const getTogglePath = (targetLang: "tr" | "en") => {
    if (!pathname) return `/${targetLang}`;
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length === 0) return `/${targetLang}`;
    if (segments[0] === "tr" || segments[0] === "en") {
      segments[0] = targetLang;
      return `/${segments.join("/")}`;
    }
    return `/${targetLang}/${segments.join("/")}`;
  };

  const isActive = (href: string) => {
    const fullHref = `/${lang}${href}`;
    if (!pathname) return false;

    if (href === "") {
      return pathname === `/${lang}`;
    }

    return pathname === fullHref || pathname.startsWith(`${fullHref}/`);
  };

  return (
    <>
      <header className="fixed left-0 top-0 z-50 w-full border-b border-on_surface/5 bg-[rgba(255,249,231,0.88)] backdrop-blur-md">
        <div className="mx-auto grid h-20 max-w-[1440px] grid-cols-[auto_1fr_auto] items-center gap-4 px-4 sm:px-6 md:h-28 md:px-10">
          {/* Branding */}
          <Link href={`/${lang}`} className="group flex items-center gap-3 md:gap-4">
            <div className="relative h-12 w-12 shrink-0 transition-transform duration-500 group-hover:scale-105 md:h-16 md:w-16">
              <Image
                src="/brand/logo/logo_background_removed.png"
                alt="Arada Burger logo"
                fill
                className="object-contain"
                priority
              />
            </div>

            <div className="flex flex-col leading-[0.9]">
              <span className="font-display text-lg font-extrabold uppercase tracking-tighter text-on_surface md:text-2xl">
                Arada
              </span>
              <span className="font-display text-lg font-extrabold uppercase tracking-tighter text-primary md:text-2xl">
                Burger
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center justify-center gap-8 md:flex lg:gap-12">
            {desktopNavLinks.map((link) => (
              <Link
                key={link.href}
                href={`/${lang}${link.href}`}
                className="group relative font-display text-xs font-bold uppercase tracking-[0.2em] text-on_surface transition-colors duration-200 hover:text-primary lg:text-sm"
              >
                {link.label[lang]}
                <span className="absolute -bottom-2 left-0 h-[2px] w-0 bg-primary transition-all duration-300 group-hover:w-full" />
              </Link>
            ))}
          </nav>

          {/* Utilities */}
          <div className="flex items-center justify-end gap-3 md:gap-6">
            <div className="flex items-center rounded-full border border-on_surface/10 bg-surface_container_highest/50 p-1 shadow-inner">
              <Link
                href={getTogglePath("tr")}
                className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all duration-200 ${
                  lang === "tr"
                    ? "bg-on_surface text-background shadow-md"
                    : "text-on_surface/40 hover:text-on_surface"
                }`}
              >
                TR
              </Link>
              <Link
                href={getTogglePath("en")}
                className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all duration-200 ${
                  lang === "en"
                    ? "bg-on_surface text-background shadow-md"
                    : "text-on_surface/40 hover:text-on_surface"
                }`}
              >
                EN
              </Link>
            </div>

            <button className="hidden rounded-full bg-primary px-8 py-3 font-display text-[10px] font-bold uppercase tracking-[0.15em] text-white sticker-shadow transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0 sm:block lg:text-xs">
              {lang === "tr" ? "Giriş" : "Login"}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 rounded-[1.75rem] border border-on_surface/10 bg-[rgba(255,249,231,0.94)] p-2 shadow-[0_10px_30px_rgba(30,28,16,0.12)] backdrop-blur-md md:hidden">
        <div className="grid grid-cols-4 gap-1">
          {mobileNavLinks.map((link) => {
            const active = isActive(link.href);
            const fullHref = `/${lang}${link.href}`;

            return (
              <Link
                key={link.href || "home"}
                href={fullHref}
                className={`flex min-h-[52px] items-center justify-center rounded-[1.1rem] px-2 text-center font-display text-[10px] font-black uppercase leading-tight tracking-[0.08em] transition-all ${
                  active
                    ? "bg-primary text-white shadow-[3px_3px_0px_rgba(30,28,16,0.18)]"
                    : "text-on_surface/70 hover:bg-surface_container_highest"
                }`}
              >
                <span>{link.label[lang]}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}