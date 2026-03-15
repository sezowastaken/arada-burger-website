"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useParams } from "next/navigation";

const navLinks = [
  { href: "/menu", label: { tr: "Menü", en: "Menu" } },
  { href: "/location", label: { tr: "Konum", en: "Locations" } },
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

  return (
    <header className="fixed left-0 top-0 z-50 w-full border-b border-on_surface/5 bg-[rgba(255,249,231,0.85)] backdrop-blur-md">
      <div className="mx-auto grid h-24 max-w-[1440px] grid-cols-[auto_1fr_auto] items-center gap-6 px-6 md:h-28 md:px-10">
        {/* Branding: Refined Logo & Wordmark */}
        <Link href={`/${lang}`} className="flex items-center gap-3 md:gap-4 group">
          <div className="relative h-14 w-14 shrink-0 md:h-16 md:w-16 transition-transform duration-500 group-hover:scale-105">
            <Image
              src="/brand/logo/logo_background_removed.png"
              alt="Arada Burger logo"
              fill
              className="object-contain"
              priority
            />
          </div>

          <div className="flex flex-col leading-[0.9]">
            <span className="font-display font-extrabold text-xl md:text-2xl uppercase tracking-tighter text-on_surface">
              Arada
            </span>
            <span className="font-display font-extrabold text-primary text-xl md:text-2xl uppercase tracking-tighter">
              Burger
            </span>
          </div>
        </Link>

        {/* Navigation: Editorial Style */}
        <nav className="hidden items-center justify-center gap-8 md:flex lg:gap-12">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={`/${lang}${link.href}`}
              className="group relative font-display font-bold text-xs lg:text-sm uppercase tracking-[0.2em] text-on_surface transition-colors duration-200 hover:text-primary"
            >
              {link.label[lang]}
              <span className="absolute -bottom-2 left-0 h-[2px] w-0 bg-primary transition-all duration-300 group-hover:w-full" />
            </Link>
          ))}
        </nav>

        {/* Utilities: Polished Pill Switcher & Button */}
        <div className="flex items-center justify-end gap-4 md:gap-6">
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

          <button className="hidden sm:block rounded-full bg-primary px-8 py-3 font-display font-bold text-[10px] lg:text-xs uppercase tracking-[0.15em] text-white sticker-shadow transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0">
            {lang === "tr" ? "Giriş" : "Login"}
          </button>
        </div>
      </div>
    </header>
  );
}
