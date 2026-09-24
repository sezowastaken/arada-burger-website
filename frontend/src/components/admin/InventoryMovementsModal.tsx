"use client";

import { useEffect, useState } from "react";
import { fetchInventoryMovements, type InventoryItem, type InventoryMovementEntry } from "@/lib/api";
import { useAdminLang } from "./AdminLanguageProvider";
import { AdminModal } from "./AdminModal";
import { ErrorNotice, Skeleton, tabularNums } from "./AdminUI";

interface Props {
  item: InventoryItem;
  onClose: () => void;
}

export function InventoryMovementsModal({ item, onClose }: Props) {
  const { t, lang } = useAdminLang();
  const [entries, setEntries] = useState<InventoryMovementEntry[] | null>(null);
  const [error, setError] = useState("");

  const dateFormat = new Intl.DateTimeFormat(lang === "tr" ? "tr-TR" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  useEffect(() => {
    let cancelled = false;

    fetchInventoryMovements(item.id)
      .then((result) => {
        if (!cancelled) setEntries(result);
      })
      .catch((loadError: unknown) => {
        if (cancelled) return;
        setError(loadError instanceof Error ? loadError.message : t.inventoryMovements.loadFailed);
      });

    return () => {
      cancelled = true;
    };
  }, [item.id, t.inventoryMovements.loadFailed]);

  return (
    <AdminModal title={t.inventoryMovements.title} subtitle={item.name} onClose={onClose} width="sm">
      <div className="px-5 py-5">
        {error ? <ErrorNotice>{error}</ErrorNotice> : null}

        {!error && entries === null ? (
          <div className="space-y-2">
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
          </div>
        ) : null}

        {entries && entries.length === 0 ? (
          <p className="rounded-[10px] bg-surface_container_low px-3 py-4 text-sm text-on_surface/55">
            {t.inventoryMovements.empty}
          </p>
        ) : null}

        {entries && entries.length > 0 ? (
          <ol className="space-y-1.5">
            {entries.map((entry) => {
              const isPurchase = entry.type === "purchase";

              return (
                <li
                  key={entry.id}
                  className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-[10px] border border-outline_variant px-3 py-2.5 text-sm"
                >
                  <span className="min-w-0">
                    <span
                      className={`mr-2 text-[0.75rem] font-semibold ${isPurchase ? "text-success" : "text-danger"}`}
                    >
                      {isPurchase ? t.inventoryMovements.purchase : t.inventoryMovements.waste}
                    </span>
                    <span className={`font-bold text-on_surface ${tabularNums}`}>
                      {isPurchase ? "+" : "-"}
                      {entry.quantity} {item.unit}
                    </span>
                    {entry.reason ? (
                      <span className="ml-2 text-[0.75rem] text-on_surface/55">{entry.reason}</span>
                    ) : null}
                    {entry.note ? (
                      <span className="block text-[0.75rem] text-on_surface/45">{entry.note}</span>
                    ) : null}
                  </span>
                  <time
                    dateTime={entry.occurredAt}
                    className={`shrink-0 text-[0.75rem] text-on_surface/45 ${tabularNums}`}
                  >
                    {dateFormat.format(new Date(entry.occurredAt))}
                  </time>
                </li>
              );
            })}
          </ol>
        ) : null}
      </div>
    </AdminModal>
  );
}
