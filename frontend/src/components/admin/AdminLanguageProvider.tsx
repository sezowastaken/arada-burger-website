"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import {
  ADMIN_LANG_COOKIE,
  adminDictionaries,
  type AdminCopy,
  type AdminLang,
} from "@/lib/adminI18n";

interface AdminLanguageValue {
  lang: AdminLang;
  setLang: (lang: AdminLang) => void;
  t: AdminCopy;
}

const AdminLanguageContext = createContext<AdminLanguageValue | null>(null);

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export function AdminLanguageProvider({
  initialLang,
  children,
}: {
  initialLang: AdminLang;
  children: ReactNode;
}) {
  // Seeded from the cookie the server already read, so the first paint is
  // already in the right language — no flash of the wrong copy on load.
  const [lang, setLangState] = useState<AdminLang>(initialLang);

  const setLang = useCallback((next: AdminLang) => {
    setLangState(next);
    document.cookie = `${ADMIN_LANG_COOKIE}=${next}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax`;
  }, []);

  const value = useMemo<AdminLanguageValue>(
    () => ({ lang, setLang, t: adminDictionaries[lang] }),
    [lang, setLang],
  );

  return <AdminLanguageContext.Provider value={value}>{children}</AdminLanguageContext.Provider>;
}

export function useAdminLang(): AdminLanguageValue {
  const value = useContext(AdminLanguageContext);
  if (!value) {
    throw new Error("useAdminLang must be used inside AdminLanguageProvider");
  }
  return value;
}
