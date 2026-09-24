"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchAdminOrders, type AdminOrderSummary } from "@/lib/api";
import { useAdminLang } from "./AdminLanguageProvider";
import { Button, EmptyState, ErrorNotice, PageHeading, Panel, TableSkeleton, formatPrice, tabularNums } from "./AdminUI";
import { OrderDetailModal } from "./OrderDetailModal";

type LoadState = "loading" | "ready" | "error";

const STATUS_TONE: Record<string, string> = {
  PENDING_PAYMENT: "bg-secondary/[0.12] text-secondary ring-1 ring-inset ring-secondary/35",
  PAID: "bg-on_surface/[0.06] text-on_surface/70 ring-1 ring-inset ring-on_surface/15",
  CONFIRMED: "bg-on_surface/[0.06] text-on_surface/70 ring-1 ring-inset ring-on_surface/15",
  PREPARING: "bg-on_surface/[0.06] text-on_surface/70 ring-1 ring-inset ring-on_surface/15",
  READY: "bg-on_surface/[0.06] text-on_surface/70 ring-1 ring-inset ring-on_surface/15",
  ON_THE_WAY: "bg-on_surface/[0.06] text-on_surface/70 ring-1 ring-inset ring-on_surface/15",
  DELIVERED: "bg-success/[0.1] text-success ring-1 ring-inset ring-success/35",
  PAYMENT_FAILED: "bg-danger/[0.08] text-danger ring-1 ring-inset ring-danger/35",
  CANCELLED: "bg-danger/[0.08] text-danger ring-1 ring-inset ring-danger/35",
  REFUND_PENDING: "bg-secondary/[0.12] text-secondary ring-1 ring-inset ring-secondary/35",
  REFUNDED: "bg-on_surface/[0.06] text-on_surface/55 ring-1 ring-inset ring-on_surface/15",
  PARTIALLY_REFUNDED: "bg-on_surface/[0.06] text-on_surface/55 ring-1 ring-inset ring-on_surface/15",
};

export function OrdersTable() {
  const { t, lang } = useAdminLang();
  const [orders, setOrders] = useState<AdminOrderSummary[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const dateFormat = new Intl.DateTimeFormat(lang === "tr" ? "tr-TR" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const load = useCallback(async () => {
    setOrders(await fetchAdminOrders());
  }, []);

  useEffect(() => {
    let cancelled = false;
    load()
      .then(() => {
        if (!cancelled) setState("ready");
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setErrorMessage(error instanceof Error ? error.message : t.orders.loadFailed);
        setState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [load, t.orders.loadFailed]);

  function statusBadge(status: string) {
    return (
      <span
        className={`inline-flex h-7 items-center whitespace-nowrap rounded-full px-3 text-[0.75rem] font-semibold ${
          STATUS_TONE[status] ?? "bg-on_surface/[0.06] text-on_surface/60 ring-1 ring-inset ring-on_surface/15"
        }`}
      >
        {t.orders.status[status] ?? status}
      </span>
    );
  }

  if (state === "loading") {
    return (
      <div className="space-y-5">
        <PageHeading title={t.orders.title} subtitle={t.orders.subtitle} />
        <TableSkeleton rows={6} columns={6} />
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="space-y-5">
        <PageHeading title={t.orders.title} />
        <ErrorNotice>
          {t.common.loadFailed}: {errorMessage}
        </ErrorNotice>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeading title={`${t.orders.title} (${orders.length})`} subtitle={t.orders.subtitle} />

      {orders.length === 0 ? (
        <Panel>
          <EmptyState title={t.orders.emptyTitle} body={t.orders.emptyBody} />
        </Panel>
      ) : (
        <>
          {/* Desktop: a real table, because this is scan-and-compare work. */}
          <Panel className="hidden overflow-hidden md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-outline_variant bg-surface_container_low/60 text-[0.6875rem] uppercase tracking-wide text-on_surface/50">
                <tr>
                  <th className="px-4 py-2.5 font-bold">{t.orders.colOrder}</th>
                  <th className="px-4 py-2.5 font-bold">{t.orders.colSource}</th>
                  <th className="px-4 py-2.5 font-bold">{t.orders.colCustomer}</th>
                  <th className="px-4 py-2.5 font-bold">{t.orders.colTotal}</th>
                  <th className="px-4 py-2.5 font-bold">{t.orders.colStatus}</th>
                  <th className="px-4 py-2.5 font-bold">{t.orders.colDate}</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-outline_variant/70">
                {orders.map((order) => (
                  <tr key={order.id} className="transition-colors duration-150 hover:bg-surface_container_low/50">
                    <td className="px-4 py-3 font-semibold text-on_surface">{order.orderNumber}</td>
                    <td className="px-4 py-3 text-on_surface/65">{t.orders.source[order.source] ?? order.source}</td>
                    <td className="px-4 py-3 text-on_surface/80">{order.customerName}</td>
                    <td className={`px-4 py-3 font-semibold text-on_surface ${tabularNums}`}>
                      {formatPrice(order.total)}
                    </td>
                    <td className="px-4 py-3">{statusBadge(order.status)}</td>
                    <td className={`px-4 py-3 text-on_surface/55 ${tabularNums}`}>
                      {dateFormat.format(new Date(order.createdAt))}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" onClick={() => setSelectedId(order.id)}>
                        {t.orders.detail}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>

          {/* Phone: cards instead of a scrolling table. */}
          <div className="space-y-2.5 md:hidden">
            {orders.map((order) => (
              <Panel key={order.id} className="px-4 py-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-on_surface">{order.orderNumber}</p>
                    <p className="truncate text-[0.75rem] text-on_surface/45">
                      {order.customerName} · {t.orders.source[order.source] ?? order.source}
                    </p>
                  </div>
                  <p className={`shrink-0 font-bold text-on_surface ${tabularNums}`}>{formatPrice(order.total)}</p>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3">
                  {statusBadge(order.status)}
                  <Button size="sm" onClick={() => setSelectedId(order.id)}>
                    {t.orders.detail}
                  </Button>
                </div>
              </Panel>
            ))}
          </div>
        </>
      )}

      {selectedId !== null ? (
        <OrderDetailModal
          orderId={selectedId}
          onClose={() => setSelectedId(null)}
          onStatusChange={(id, status) => {
            setOrders((current) => current.map((order) => (order.id === id ? { ...order, status } : order)));
          }}
        />
      ) : null}
    </div>
  );
}
