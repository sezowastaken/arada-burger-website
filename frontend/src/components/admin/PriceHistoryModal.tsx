"use client";

import { useEffect, useState } from "react";
import { fetchPriceHistory, type AdminProduct, type PriceHistory } from "@/lib/api";

interface Props {
  product: AdminProduct;
  onClose: () => void;
}

const dateFormat = new Intl.DateTimeFormat("tr-TR", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatPrice(value: number) {
  return `₺${value.toFixed(2)}`;
}

export function PriceHistoryModal({ product, onClose }: Props) {
  const [data, setData] = useState<PriceHistory | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    fetchPriceHistory(product.id)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((loadError: unknown) => {
        if (cancelled) return;
        setError(loadError instanceof Error ? loadError.message : "Failed to load price history");
      });

    return () => {
      cancelled = true;
    };
  }, [product.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4">
      <div className="my-8 w-full max-w-lg rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold">Price history</h2>
            <p className="text-xs text-slate-500">{product.name.en}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded px-2 py-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-5">
          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          {!error && data === null ? (
            <p className="text-sm text-slate-500">Loading…</p>
          ) : null}

          {data ? (
            <>
              <p className="mb-4 text-sm text-slate-600">
                Current price{" "}
                <span className="font-semibold text-slate-900">
                  {formatPrice(data.currentPrice)}
                </span>
              </p>

              {data.history.length === 0 ? (
                <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-500">
                  This price has not changed since the product was created.
                </p>
              ) : (
                <ol className="space-y-2">
                  {data.history.map((entry) => {
                    const raised = entry.newPrice > entry.oldPrice;

                    return (
                      <li
                        key={entry.id}
                        className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2 text-sm"
                      >
                        <span className="text-slate-600">
                          {formatPrice(entry.oldPrice)}
                          <span aria-hidden="true"> → </span>
                          <span className="sr-only"> changed to </span>
                          <span className="font-semibold text-slate-900">
                            {formatPrice(entry.newPrice)}
                          </span>
                          <span
                            className={`ml-2 text-xs font-medium ${
                              raised ? "text-amber-700" : "text-emerald-700"
                            }`}
                          >
                            {raised ? "increase" : "decrease"}
                          </span>
                        </span>
                        <time
                          dateTime={entry.changedAt}
                          className="shrink-0 text-xs text-slate-500"
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
      </div>
    </div>
  );
}
