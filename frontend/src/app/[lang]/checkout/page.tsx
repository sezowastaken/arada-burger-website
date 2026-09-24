"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { fetchMenu, fetchStoreSettings, submitCheckout, type MenuProduct, type StoreSettings } from "@/lib/api";
import { useCart } from "@/lib/cart";

function formatPrice(value: number): string {
  return `₺${Number.isInteger(value) ? value : value.toFixed(2)}`;
}

export default function CheckoutPage() {
  const params = useParams();
  const lang = (params?.lang as "tr" | "en") || "tr";
  const isTR = lang === "tr";
  const router = useRouter();

  const { quantities, clear } = useCart();
  const [productBySlug, setProductBySlug] = useState<Map<string, MenuProduct> | null>(null);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loadError, setLoadError] = useState("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [district, setDistrict] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [deliveryNote, setDeliveryNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchMenu(), fetchStoreSettings()])
      .then(([menu, storeSettings]) => {
        if (cancelled) return;
        const map = new Map<string, MenuProduct>();
        for (const category of menu.categories) {
          for (const product of category.products) map.set(product.slug, product);
        }
        setProductBySlug(map);
        setSettings(storeSettings);
      })
      .catch(() => {
        if (!cancelled) setLoadError(isTR ? "Sayfa yüklenemedi" : "Failed to load the page");
      });
    return () => {
      cancelled = true;
    };
  }, [isTR]);

  const lines = useMemo(() => {
    if (!productBySlug) return null;
    return Object.entries(quantities)
      .map(([slug, quantity]) => ({ slug, quantity, product: productBySlug.get(slug) ?? null }))
      .filter(
        (line) => line.quantity > 0 && line.product && line.product.isActive && line.product.isAvailable,
      );
  }, [quantities, productBySlug]);

  const subtotal = useMemo(() => {
    if (!lines) return 0;
    return lines.reduce((sum, line) => sum + line.product!.price * line.quantity, 0);
  }, [lines]);

  const ready = lines !== null && settings !== null;
  const minOrderAmount = settings?.minOrderAmount ?? 0;
  const belowMinimum = ready && subtotal < minOrderAmount;
  const total = subtotal + (settings?.deliveryFee ?? 0);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!lines || lines.length === 0) return;
    setError("");

    if (!name.trim() || !phone.trim() || !district.trim() || !addressLine.trim()) {
      setError(isTR ? "Lütfen zorunlu alanları doldur." : "Please fill in the required fields.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitCheckout({
        lang,
        items: lines.map((line) => ({ slug: line.slug, quantity: line.quantity })),
        customer: { name: name.trim(), phone: phone.trim(), email: email.trim() || undefined },
        address: {
          district: district.trim(),
          addressLine: addressLine.trim(),
          deliveryNote: deliveryNote.trim() || undefined,
        },
      });
      clear();
      window.location.href = result.checkoutUrl;
    } catch (submitError: unknown) {
      setError(submitError instanceof Error ? submitError.message : isTR ? "Sipariş oluşturulamadı" : "Could not create the order");
      setSubmitting(false);
    }
  }

  useEffect(() => {
    // Guarded by `submitting`: a successful submit calls clear() and then
    // navigates away via window.location.href, which also makes `lines`
    // momentarily empty — without this guard that would race this redirect
    // against the real one.
    if (ready && lines!.length === 0 && !submitting) {
      router.replace(`/${lang}/cart`);
    }
  }, [ready, lines, router, lang, submitting]);

  return (
    <div className="mx-auto max-w-2xl px-6 py-12 md:py-16">
      <h1 className="font-display text-3xl font-black uppercase tracking-tighter text-on_surface md:text-4xl">
        {isTR ? "Siparişi Tamamla" : "Checkout"}
      </h1>

      {loadError ? <p className="mt-6 text-primary">{loadError}</p> : null}

      {!ready && !loadError ? (
        <p className="mt-10 text-center text-on_surface/50">{isTR ? "Yükleniyor…" : "Loading…"}</p>
      ) : null}

      {ready && lines!.length > 0 ? (
        <>
          {settings && !settings.acceptingOrders ? (
            <p className="mt-6 rounded-[1.25rem] border border-primary/30 bg-primary/[0.06] px-4 py-3 text-sm font-semibold text-primary">
              {isTR
                ? "Şu anda online sipariş kabul etmiyoruz. Lütfen daha sonra tekrar dene."
                : "We're not accepting online orders right now. Please check back later."}
            </p>
          ) : null}

          {/* Order summary */}
          <div className="mt-8 space-y-2 rounded-[1.5rem] border border-on_surface/10 bg-background/75 p-5">
            {lines!.map((line) => (
              <div key={line.slug} className="flex items-center justify-between text-sm">
                <span className="text-on_surface/75">
                  {line.quantity}× {line.product!.name[lang]}
                </span>
                <span className="font-semibold text-on_surface [font-variant-numeric:tabular-nums]">
                  {formatPrice(line.product!.price * line.quantity)}
                </span>
              </div>
            ))}
            <div className="mt-3 space-y-1 border-t border-on_surface/10 pt-3 text-sm">
              <div className="flex items-center justify-between text-on_surface/60">
                <span>{isTR ? "Ara toplam" : "Subtotal"}</span>
                <span className="[font-variant-numeric:tabular-nums]">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-on_surface/60">
                <span>{isTR ? "Teslimat ücreti" : "Delivery fee"}</span>
                <span className="[font-variant-numeric:tabular-nums]">{formatPrice(settings?.deliveryFee ?? 0)}</span>
              </div>
              <div className="flex items-center justify-between font-display text-base font-black text-on_surface">
                <span>{isTR ? "Toplam" : "Total"}</span>
                <span className="[font-variant-numeric:tabular-nums]">{formatPrice(total)}</span>
              </div>
            </div>
          </div>

          {belowMinimum ? (
            <p className="mt-4 text-sm font-semibold text-primary">
              {isTR
                ? `Minimum sipariş tutarı ${formatPrice(minOrderAmount)}. Sepetine ekle ve devam et.`
                : `Minimum order amount is ${formatPrice(minOrderAmount)}. Add a bit more to continue.`}
            </p>
          ) : null}

          {/* Customer + delivery form */}
          <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-4">
            <div>
              <label className="mb-1.5 block text-[0.75rem] font-bold uppercase tracking-wide text-on_surface/55" htmlFor="name">
                {isTR ? "Ad Soyad" : "Full name"}
              </label>
              <input
                id="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded-[0.9rem] border border-on_surface/15 bg-background px-4 py-3 text-sm text-on_surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[0.75rem] font-bold uppercase tracking-wide text-on_surface/55" htmlFor="phone">
                {isTR ? "Telefon" : "Phone"}
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="w-full rounded-[0.9rem] border border-on_surface/15 bg-background px-4 py-3 text-sm text-on_surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[0.75rem] font-bold uppercase tracking-wide text-on_surface/55" htmlFor="email">
                {isTR ? "E-posta (opsiyonel)" : "Email (optional)"}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-[0.9rem] border border-on_surface/15 bg-background px-4 py-3 text-sm text-on_surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[0.75rem] font-bold uppercase tracking-wide text-on_surface/55" htmlFor="district">
                {isTR ? "Mahalle / Bölge (Marmaris)" : "District (Marmaris)"}
              </label>
              <input
                id="district"
                value={district}
                onChange={(event) => setDistrict(event.target.value)}
                placeholder={isTR ? "örn. İçmeler" : "e.g. İçmeler"}
                className="w-full rounded-[0.9rem] border border-on_surface/15 bg-background px-4 py-3 text-sm text-on_surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[0.75rem] font-bold uppercase tracking-wide text-on_surface/55" htmlFor="addressLine">
                {isTR ? "Açık Adres" : "Address"}
              </label>
              <textarea
                id="addressLine"
                rows={3}
                value={addressLine}
                onChange={(event) => setAddressLine(event.target.value)}
                placeholder={isTR ? "Sokak, bina, daire no…" : "Street, building, apartment no…"}
                className="w-full rounded-[0.9rem] border border-on_surface/15 bg-background px-4 py-3 text-sm text-on_surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[0.75rem] font-bold uppercase tracking-wide text-on_surface/55" htmlFor="deliveryNote">
                {isTR ? "Teslimat notu (opsiyonel)" : "Delivery note (optional)"}
              </label>
              <input
                id="deliveryNote"
                value={deliveryNote}
                onChange={(event) => setDeliveryNote(event.target.value)}
                className="w-full rounded-[0.9rem] border border-on_surface/15 bg-background px-4 py-3 text-sm text-on_surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
              />
            </div>

            {error ? <p className="text-sm font-semibold text-primary">{error}</p> : null}

            <button
              type="submit"
              disabled={submitting || belowMinimum || (settings ? !settings.acceptingOrders : false)}
              className="mt-2 flex w-full items-center justify-center rounded-full bg-primary px-7 py-4 font-display text-sm font-black uppercase tracking-[0.14em] text-white sticker-shadow transition-transform duration-200 hover:-translate-y-0.5 disabled:pointer-events-none disabled:bg-on_surface/20"
            >
              {submitting
                ? isTR
                  ? "Yönlendiriliyor…"
                  : "Redirecting…"
                : isTR
                  ? `Ödemeye Geç (${formatPrice(total)})`
                  : `Continue to Payment (${formatPrice(total)})`}
            </button>

            <p className="text-center text-[0.75rem] text-on_surface/45">
              <Link href={`/${lang}/cart`} className="underline">
                {isTR ? "Sepete geri dön" : "Back to cart"}
              </Link>
            </p>
          </form>
        </>
      ) : null}
    </div>
  );
}
