"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { fetchMenu, type MenuProduct } from "@/lib/api";
import { useCart } from "@/lib/cart";

function formatPrice(value: number): string {
  return `₺${Number.isInteger(value) ? value : value.toFixed(2)}`;
}

export default function CartPage() {
  const params = useParams();
  const lang = (params?.lang as "tr" | "en") || "tr";
  const isTR = lang === "tr";

  const { quantities, setQuantity, removeItem, totalCount } = useCart();
  const [productBySlug, setProductBySlug] = useState<Map<string, MenuProduct> | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchMenu().then((result) => {
      if (cancelled) return;
      const map = new Map<string, MenuProduct>();
      for (const category of result.categories) {
        for (const product of category.products) {
          map.set(product.slug, product);
        }
      }
      setProductBySlug(map);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Only slugs the cart actually has a quantity for, resolved against the
  // freshest menu data — price, name and availability always come from here,
  // never from anything stored client-side (see lib/cart.tsx).
  const lines = useMemo(() => {
    if (!productBySlug) return null;
    return Object.entries(quantities)
      .map(([slug, quantity]) => ({ slug, quantity, product: productBySlug.get(slug) ?? null }))
      .filter((line) => line.quantity > 0);
  }, [quantities, productBySlug]);

  const subtotal = useMemo(() => {
    if (!lines) return 0;
    return lines.reduce((sum, line) => {
      if (!line.product || !line.product.isActive || !line.product.isAvailable) return sum;
      return sum + line.product.price * line.quantity;
    }, 0);
  }, [lines]);

  const loading = lines === null;
  const empty = !loading && lines.length === 0;

  return (
    <div className="mx-auto max-w-2xl px-6 py-12 md:py-16">
      <h1 className="font-display text-3xl font-black uppercase tracking-tighter text-on_surface md:text-4xl">
        {isTR ? "Sepetim" : "My Cart"}
      </h1>

      {loading ? (
        <p className="mt-10 text-center text-on_surface/50">{isTR ? "Yükleniyor…" : "Loading…"}</p>
      ) : empty ? (
        <div className="mt-10 rounded-[1.75rem] border border-dashed border-on_surface/15 bg-background/60 px-6 py-16 text-center">
          <p className="text-lg font-bold text-on_surface">{isTR ? "Sepetin boş" : "Your cart is empty"}</p>
          <p className="mt-2 text-sm text-on_surface/55">
            {isTR ? "Menüden birkaç şey ekleyerek başla." : "Add a few things from the menu to get started."}
          </p>
          <Link
            href={`/${lang}/menu`}
            className="mt-6 inline-flex rounded-full bg-primary px-7 py-3 font-display text-sm font-black uppercase tracking-[0.14em] text-white sticker-shadow transition-transform duration-200 hover:-translate-y-0.5"
          >
            {isTR ? "Menüye Git" : "Go to Menu"}
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-8 space-y-3">
            {lines!.map((line) => {
              const unavailable = !line.product || !line.product.isActive || !line.product.isAvailable;

              return (
                <div
                  key={line.slug}
                  className="flex items-center gap-4 rounded-[1.5rem] border border-on_surface/10 bg-background/75 p-4"
                >
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[1rem] bg-surface_container_highest">
                    {line.product?.image ? (
                      <Image src={line.product.image} alt={line.product.name[lang]} fill className="object-contain p-1" />
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-sm font-black uppercase tracking-tight text-on_surface">
                      {line.product ? line.product.name[lang] : line.slug}
                    </p>
                    {unavailable ? (
                      <p className="mt-0.5 text-[0.75rem] font-semibold text-primary">
                        {isTR ? "Artık mevcut değil" : "No longer available"}
                      </p>
                    ) : (
                      <p className="mt-0.5 text-[0.8125rem] text-on_surface/55">{formatPrice(line.product!.price)}</p>
                    )}
                  </div>

                  {unavailable ? (
                    <button
                      type="button"
                      onClick={() => removeItem(line.slug)}
                      className="shrink-0 text-[0.8125rem] font-bold text-primary underline"
                    >
                      {isTR ? "Kaldır" : "Remove"}
                    </button>
                  ) : (
                    <>
                      <div className="flex shrink-0 items-center gap-2 rounded-full border border-on_surface/15 px-1 py-1">
                        <button
                          type="button"
                          aria-label={isTR ? "Azalt" : "Decrease"}
                          onClick={() => setQuantity(line.slug, line.quantity - 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-full text-on_surface transition-colors hover:bg-surface_container_highest"
                        >
                          −
                        </button>
                        <span className="w-5 text-center text-sm font-bold text-on_surface [font-variant-numeric:tabular-nums]">
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label={isTR ? "Artır" : "Increase"}
                          onClick={() => setQuantity(line.slug, line.quantity + 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-full text-on_surface transition-colors hover:bg-surface_container_highest"
                        >
                          +
                        </button>
                      </div>

                      <p className="w-16 shrink-0 text-right text-sm font-black text-on_surface [font-variant-numeric:tabular-nums]">
                        {formatPrice(line.product!.price * line.quantity)}
                      </p>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-8 flex items-center justify-between border-t border-on_surface/10 pt-5">
            <span className="font-display text-sm font-bold uppercase tracking-wide text-on_surface/60">
              {isTR ? "Ara Toplam" : "Subtotal"}
            </span>
            <span className="font-display text-2xl font-black text-on_surface [font-variant-numeric:tabular-nums]">
              {formatPrice(subtotal)}
            </span>
          </div>

          <Link
            href={`/${lang}/checkout`}
            aria-disabled={subtotal <= 0}
            className={`mt-5 flex w-full items-center justify-center rounded-full px-7 py-4 font-display text-sm font-black uppercase tracking-[0.14em] text-white sticker-shadow transition-transform duration-200 ${
              subtotal > 0 ? "bg-primary hover:-translate-y-0.5" : "pointer-events-none bg-on_surface/20"
            }`}
          >
            {isTR ? `Sepeti Onayla (${totalCount})` : `Checkout (${totalCount})`}
          </Link>
        </>
      )}
    </div>
  );
}
