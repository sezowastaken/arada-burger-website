"use client";

import { useEffect, useState } from "react";
import { fetchPriceHistory, type AdminProduct, type PriceHistory } from "@/lib/api";
import { useAdminLang } from "./AdminLanguageProvider";
import { AdminModal } from "./AdminModal";
import { ErrorNotice, Skeleton, formatPrice, tabularNums } from "./AdminUI";

interface Props {
  product: AdminProduct;
  onClose: () => void;
}

export function PriceHistoryModal({ product, onClose }: Props) {
  const { t, lang } = useAdminLang();
  const [data, setData] = useState<PriceHistory | null>(null);
  const [error, setError] = useState("");

  const dateFormat = new Intl.DateTimeFormat(lang === "tr" ? "tr-TR" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  useEffect(() => {
    let cancelled = false;

    fetchPriceHistory(product.id)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((loadError: unknown) => {
        if (cancelled) return;
        setError(loadError instanceof Error ? loadError.message : t.priceHistory.loadFailed);
      });

    return () => {
      cancelled = true;
    };
  }, [product.id, t.priceHistory.loadFailed]);

  return (
    <AdminModal
      title={t.priceHistory.title}
      subtitle={product.name[lang]}
      onClose={onClose}
      width="sm"
    >
      <div className="px-5 py-5">
        {error ? <ErrorNotice>{error}</ErrorNotice> : null}

        {!error && data === null ? (
          <div className="space-y-2">
            <Skeleton className="mb-4 h-4 w-32" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
          </div>
        ) : null}

        {data ? (
          <>
            <p className="mb-4 flex items-baseline gap-2 text-sm text-on_surface/55">
              {t.priceHistory.currentPrice}
              <span className={`text-lg font-bold text-on_surface ${tabularNums}`}>
                {formatPrice(data.currentPrice)}
              </span>
            </p>

            {data.history.length === 0 ? (
              <p className="rounded-[10px] bg-surface_container_low px-3 py-4 text-sm text-on_surface/55">
                {t.priceHistory.empty}
              </p>
            ) : (
              <ol className="space-y-1.5">
                {data.history.map((entry) => {
                  const raised = entry.newPrice > entry.oldPrice;

                  return (
                    <li
                      key={entry.id}
                      className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-[10px] border border-outline_variant px-3 py-2.5 text-sm"
                    >
                      <span className={`text-on_surface/55 ${tabularNums}`}>
                        {formatPrice(entry.oldPrice)}
                        <span aria-hidden="true"> → </span>
                        <span className="sr-only"> → </span>
                        <span className="font-bold text-on_surface">
                          {formatPrice(entry.newPrice)}
                        </span>
                        <span
                          className={`ml-2 text-[0.75rem] font-semibold ${
                            raised ? "text-secondary" : "text-success"
                          }`}
                        >
                          {raised ? t.priceHistory.increase : t.priceHistory.decrease}
                        </span>
                      </span>
                      <time
                        dateTime={entry.changedAt}
                        className={`shrink-0 text-[0.75rem] text-on_surface/45 ${tabularNums}`}
                      >
                        {dateFormat.format(new Date(entry.changedAt))}
                      </time>
                    </li>
                  );
                })}
              </ol>
            )}
          </>
        ) : null}
      </div>
    </AdminModal>
  );
}
