"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackMenuView, trackPageView } from "@/lib/analytics";

/**
 * Fires `page_view` (and `menu_view` on the menu route) on every route
 * change. Mounted once in the `[lang]` layout so every page is covered
 * without each page having to remember to call this itself.
 */
export function AnalyticsBeacon({ lang }: { lang: "tr" | "en" }) {
  const pathname = usePathname();

  useEffect(() => {
    trackPageView(pathname, lang);
    if (pathname.includes("/menu")) {
      trackMenuView(pathname, lang);
    }
  }, [pathname, lang]);

  return null;
}
