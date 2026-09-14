import type { Metadata } from "next";
import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { AdminLanguageProvider } from "@/components/admin/AdminLanguageProvider";
import { AdminShell } from "@/components/admin/AdminShell";
import { ADMIN_LANG_COOKIE, DEFAULT_ADMIN_LANG, isAdminLang } from "@/lib/adminI18n";

export const metadata: Metadata = {
  title: "Arada Burger Admin",
  description: "Internal admin panel for Arada Burger.",
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // Read the preference on the server so the first paint is already in the
  // right language, rather than flashing one and correcting to the other.
  const stored = (await cookies()).get(ADMIN_LANG_COOKIE)?.value;
  const lang = isAdminLang(stored) ? stored : DEFAULT_ADMIN_LANG;

  return (
    <AdminLanguageProvider initialLang={lang}>
      <AdminShell>{children}</AdminShell>
    </AdminLanguageProvider>
  );
}
