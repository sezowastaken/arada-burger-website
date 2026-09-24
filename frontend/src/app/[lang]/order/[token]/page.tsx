"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { fetchOrder, type PublicOrder } from "@/lib/api";

function formatPrice(value: number): string {
  return `₺${Number.isInteger(value) ? value : value.toFixed(2)}`;
}

const STATUS_COPY: Record<string, { tr: string; en: string; tone: "good" | "bad" | "pending" }> = {
  PENDING_PAYMENT: { tr: "Ödeme bekleniyor", en: "Awaiting payment", tone: "pending" },
  PAID: { tr: "Ödeme alındı — siparişin bize ulaştı", en: "Payment received — your order is in", tone: "good" },
  CONFIRMED: { tr: "Siparişin onaylandı", en: "Your order is confirmed", tone: "good" },
  PREPARING: { tr: "Hazırlanıyor", en: "Being prepared", tone: "good" },
  READY: { tr: "Hazır", en: "Ready", tone: "good" },
  ON_THE_WAY: { tr: "Yolda", en: "On the way", tone: "good" },
  DELIVERED: { tr: "Teslim edildi", en: "Delivered", tone: "good" },
  PAYMENT_FAILED: { tr: "Ödeme başarısız oldu", en: "Payment failed", tone: "bad" },
  CANCELLED: { tr: "Sipariş iptal edildi", en: "Order cancelled", tone: "bad" },
  REFUND_PENDING: { tr: "İade bekleniyor", en: "Refund pending", tone: "pending" },
  REFUNDED: { tr: "İade edildi", en: "Refunded", tone: "pending" },
  PARTIALLY_REFUNDED: { tr: "Kısmi iade edildi", en: "Partially refunded", tone: "pending" },
};

export default function OrderPage() {
  const params = useParams();
  const lang = (params?.lang as "tr" | "en") || "tr";
  const token = params?.token as string;
  const isTR = lang === "tr";

  const [order, setOrder] = useState<PublicOrder | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchOrder(token)
      .then((result) => {
        if (!cancelled) setOrder(result);
      })
      .catch(() => {
        if (!cancelled) setError(isTR ? "Sipariş bulunamadı" : "Order not found");
      });
    return () => {
      cancelled = true;
    };
  }, [token, isTR]);

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <p className="text-lg font-bold text-on_surface">{error}</p>
        <Link href={`/${lang}/menu`} className="mt-4 inline-block underline">
          {isTR ? "Menüye dön" : "Back to menu"}
        </Link>
      </div>
    );
  }

  if (!order) {
    return <p className="mx-auto max-w-2xl px-6 py-16 text-center text-on_surface/50">{isTR ? "Yükleniyor…" : "Loading…"}</p>;
  }

  const status = STATUS_COPY[order.status] ?? { tr: order.status, en: order.status, tone: "pending" as const };
  const toneClass = {
    good: "border-success/30 bg-success/[0.06] text-success",
    bad: "border-primary/30 bg-primary/[0.06] text-primary",
    pending: "border-secondary/40 bg-secondary/[0.08] text-secondary",
  }[status.tone];

  return (
    <div className="mx-auto max-w-2xl px-6 py-12 md:py-16">
      <p className="font-display text-xs font-black uppercase tracking-[0.3em] text-secondary">{order.orderNumber}</p>
      <h1 className="mt-1 font-display text-3xl font-black uppercase tracking-tighter text-on_surface md:text-4xl">
        {isTR ? "Sipariş Durumu" : "Order Status"}
      </h1>

      <div className={`mt-6 rounded-[1.25rem] border px-5 py-4 text-sm font-bold ${toneClass}`}>
        {isTR ? status.tr : status.en}
      </div>

      {order.status === "PAYMENT_FAILED" ? (
        <Link
          href={`/${lang}/checkout`}
          className="mt-4 inline-flex rounded-full bg-primary px-6 py-3 font-display text-sm font-black uppercase tracking-[0.14em] text-white sticker-shadow"
        >
          {isTR ? "Tekrar Dene" : "Try Again"}
        </Link>
      ) : null}

      <div className="mt-8 space-y-2 rounded-[1.5rem] border border-on_surface/10 bg-background/75 p-5">
        {order.items.map((item, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <span className="text-on_surface/75">
              {item.quantity}× {item.name[lang]}
            </span>
            <span className="font-semibold text-on_surface [font-variant-numeric:tabular-nums]">
              {formatPrice(item.lineTotal)}
            </span>
          </div>
        ))}
        <div className="mt-3 space-y-1 border-t border-on_surface/10 pt-3 text-sm">
          <div className="flex items-center justify-between text-on_surface/60">
            <span>{isTR ? "Ara toplam" : "Subtotal"}</span>
            <span className="[font-variant-numeric:tabular-nums]">{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-on_surface/60">
            <span>{isTR ? "Teslimat ücreti" : "Delivery fee"}</span>
            <span className="[font-variant-numeric:tabular-nums]">{formatPrice(order.deliveryFee)}</span>
          </div>
          <div className="flex items-center justify-between font-display text-base font-black text-on_surface">
            <span>{isTR ? "Toplam" : "Total"}</span>
            <span className="[font-variant-numeric:tabular-nums]">{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>

      {order.address ? (
        <div className="mt-6 rounded-[1.5rem] border border-on_surface/10 bg-background/75 p-5 text-sm text-on_surface/75">
          <p className="font-display text-[0.75rem] font-bold uppercase tracking-wide text-on_surface/50">
            {isTR ? "Teslimat Adresi" : "Delivery Address"}
          </p>
          <p className="mt-2">
            {order.customerName} · {order.customerPhone}
          </p>
          <p>
            {order.address.addressLine}, {order.address.district}, {order.address.city}
          </p>
          {order.address.deliveryNote ? <p className="mt-1 text-on_surface/55">{order.address.deliveryNote}</p> : null}
        </div>
      ) : null}

      <p className="mt-8 text-center text-[0.75rem] text-on_surface/45">
        <Link href={`/${lang}/menu`} className="underline">
          {isTR ? "Menüye dön" : "Back to menu"}
        </Link>
      </p>
    </div>
  );
}
