"use client";

import { useAdminLang } from "./AdminLanguageProvider";
import { PageHeading, Panel } from "./AdminUI";
import type { AdminCopy } from "@/lib/adminI18n";

type Section = keyof Omit<AdminCopy["placeholder"], "comingSoonTitle">;

const sectionTitle: Record<Section, (t: AdminCopy) => string> = {
  dashboard: (t) => t.nav.dashboard,
  orders: (t) => t.nav.orders,
  inventory: (t) => t.nav.inventory,
  analytics: (t) => t.nav.analytics,
  settings: (t) => t.nav.settings,
};

/**
 * Unbuilt sections say what will live here and why it is not here yet, so the
 * panel reads as planned rather than broken.
 */
export function PlaceholderPage({ section }: { section: Section }) {
  const { t } = useAdminLang();

  return (
    <div className="space-y-5">
      <PageHeading title={sectionTitle[section](t)} />
      <Panel className="px-6 py-12">
        <div className="mx-auto max-w-md text-center">
          <p className="text-[0.9375rem] font-semibold text-on_surface">
            {t.placeholder.comingSoonTitle}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-on_surface/55">
            {t.placeholder[section]}
          </p>
        </div>
      </Panel>
    </div>
  );
}
