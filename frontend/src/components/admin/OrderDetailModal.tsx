"use client";

import { useEffect, useState } from "react";
import { fetchAdminOrder, setAdminOrderStatus, type AdminOrderDetail } from "@/lib/api";
import { ORDER_STATUSES } from "@/lib/orderStatuses";
import { useAdminLang } from "./AdminLanguageProvider";
import { AdminModal } from "./AdminModal";
import { Button, ErrorNotice, Skeleton, fieldInputClass, formatPrice, tabularNums } from "./AdminUI";

interface Props {
  orderId: number;
  onClose: () => void;
  onStatusChange: (id: number, status: string) => void;
}

export function OrderDetailModal({ orderId, onClose, onStatusChange }: Props) {
  const { t, lang } = useAdminLang();
  const [order, setOrder] = useState<AdminOrderDetail | null>(null);
  const [loadError, setLoadError] = useState("");
  const [statusChoice, setStatusChoice] = useState<string>("");
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState("");

  const dateFormat = new Intl.DateTimeFormat(lang === "tr" ? "tr-TR" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  function load() {
    fetchAdminOrder(orderId)
      .then((result) => {
        setOrder(result);
        setStatusChoice(result.status);
      })
      .catch((error: unknown) => {
        setLoadError(error instanceof Error ? error.message : t.orders.loadFailed);
      });
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  async function handleUpdateStatus() {
    if (!order || statusChoice === order.status) return;
    setUpdateError("");
    setUpdating(true);
    try {
      const result = await setAdminOrderStatus(order.id, statusChoice);
      onStatusChange(order.id, result.status);
      load();
    } catch (error: unknown) {
      setUpdateError(error instanceof Error ? error.message : t.orders.errUpdate);
    } finally {
      setUpdating(false);
    }
  }

  return (
    <AdminModal title={t.orders.detailTitle} subtitle={order ? order.orderNumber : undefined} onClose={onClose}>
      <div className="space-y-5 px-5 py-5">
        {loadError ? <ErrorNotice>{loadError}</ErrorNotice> : null}

        {!loadError && !order ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
          </div>
        ) : null}

        {order ? (
          <>
            <div>
              <p className="text-[0.75rem] font-bold uppercase tracking-wide text-on_surface/50">
                {t.orders.customerTitle}
              </p>
              <p className="mt-1 text-sm text-on_surface">
                {order.customerName} · {order.customerPhone}
                {order.customerEmail ? ` · ${order.customerEmail}` : ""}
              </p>
              {order.customerNote ? <p className="mt-1 text-sm text-on_surface/60">{order.customerNote}</p> : null}
            </div>

            <div>
              <p className="text-[0.75rem] font-bold uppercase tracking-wide text-on_surface/50">
                {t.orders.addressTitle}
              </p>
              {order.address ? (
                <p className="mt-1 text-sm text-on_surface">
                  {order.address.addressLine}, {order.address.district}, {order.address.city}
                  {order.address.deliveryNote ? ` — ${order.address.deliveryNote}` : ""}
                </p>
              ) : (
                <p className="mt-1 text-sm text-on_surface/45">{t.orders.noAddress}</p>
              )}
            </div>

            <div>
              <p className="text-[0.75rem] font-bold uppercase tracking-wide text-on_surface/50">{t.orders.itemsTitle}</p>
              <ul className="mt-2 space-y-1.5">
                {order.items.map((item, index) => (
                  <li key={index} className="flex items-center justify-between text-sm">
                    <span className="text-on_surface/80">
                      {item.quantity}× {item.name[lang]}
                    </span>
                    <span className={`font-semibold text-on_surface ${tabularNums}`}>{formatPrice(item.lineTotal)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 space-y-1 border-t border-outline_variant pt-3 text-sm">
                <div className="flex items-center justify-between text-on_surface/60">
                  <span>{t.orders.subtotal}</span>
                  <span className={tabularNums}>{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-on_surface/60">
                  <span>{t.orders.deliveryFee}</span>
                  <span className={tabularNums}>{formatPrice(order.deliveryFee)}</span>
                </div>
                <div className="flex items-center justify-between text-base font-bold text-on_surface">
                  <span>{t.orders.total}</span>
                  <span className={tabularNums}>{formatPrice(order.total)}</span>
                </div>
              </div>
            </div>

            {order.payments.length > 0 ? (
              <div>
                <p className="text-[0.75rem] font-bold uppercase tracking-wide text-on_surface/50">
                  {t.orders.paymentsTitle}
                </p>
                <ul className="mt-2 space-y-1.5">
                  {order.payments.map((payment, index) => (
                    <li key={index} className="flex items-center justify-between text-sm text-on_surface/75">
                      <span>
                        {payment.provider} · {payment.status}
                      </span>
                      <span className={tabularNums}>{formatPrice(payment.amount)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div>
              <p className="text-[0.75rem] font-bold uppercase tracking-wide text-on_surface/50">
                {t.orders.historyTitle}
              </p>
              <ul className="mt-2 space-y-1">
                {order.statusHistory.map((entry, index) => (
                  <li key={index} className="flex items-center justify-between text-[0.8125rem] text-on_surface/60">
                    <span>{t.orders.status[entry.status] ?? entry.status}</span>
                    <span className={tabularNums}>{dateFormat.format(new Date(entry.changedAt))}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-wrap items-end gap-3 border-t border-outline_variant pt-4">
              <div className="min-w-[10rem] flex-1">
                <label className="mb-1.5 block text-[0.75rem] font-semibold uppercase tracking-wide text-on_surface/55">
                  {t.orders.colStatus}
                </label>
                <select
                  value={statusChoice}
                  onChange={(event) => setStatusChoice(event.target.value)}
                  className={`${fieldInputClass} h-10 py-0`}
                >
                  {ORDER_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {t.orders.status[status] ?? status}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                variant="primary"
                loading={updating}
                disabled={statusChoice === order.status}
                onClick={() => void handleUpdateStatus()}
              >
                {t.orders.updateStatus}
              </Button>
            </div>
            {updateError ? <ErrorNotice>{updateError}</ErrorNotice> : null}
          </>
        ) : null}
      </div>
    </AdminModal>
  );
}
