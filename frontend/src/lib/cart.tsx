"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const STORAGE_KEY = "arada-cart";

/**
 * Only slug + quantity ever lives here (and in localStorage) — never price
 * or name. Every price shown anywhere (header badge excepted, which only
 * needs a count) is re-resolved from a fresh menu fetch at render time, the
 * same "never trust a stored/client price" rule the checkout endpoint
 * itself enforces server-side. That also means a product renamed, repriced,
 * or taken off the menu since it was added just falls out of the join
 * instead of needing its own stale-data handling here.
 */
interface CartContextValue {
  quantities: Record<string, number>;
  totalCount: number;
  addItem: (slug: string, quantity?: number) => void;
  setQuantity: (slug: string, quantity: number) => void;
  removeItem: (slug: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  // Read localStorage only after mount — reading it during the initial
  // render would desync from the server-rendered markup (which knows
  // nothing about this browser's cart) and trip a hydration mismatch.
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setQuantities(JSON.parse(raw));
    } catch {
      // Private browsing, corrupted value, or storage blocked — start empty.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(quantities));
    } catch {
      // Storage full or blocked — the cart still works for this tab session.
    }
  }, [quantities, hydrated]);

  const addItem = useCallback((slug: string, quantity = 1) => {
    setQuantities((current) => ({ ...current, [slug]: (current[slug] ?? 0) + quantity }));
  }, []);

  const setQuantity = useCallback((slug: string, quantity: number) => {
    setQuantities((current) => {
      if (quantity <= 0) {
        const next = { ...current };
        delete next[slug];
        return next;
      }
      return { ...current, [slug]: quantity };
    });
  }, []);

  const removeItem = useCallback((slug: string) => {
    setQuantities((current) => {
      const next = { ...current };
      delete next[slug];
      return next;
    });
  }, []);

  const clear = useCallback(() => setQuantities({}), []);

  const totalCount = useMemo(() => Object.values(quantities).reduce((sum, q) => sum + q, 0), [quantities]);

  const value = useMemo(
    () => ({ quantities, totalCount, addItem, setQuantity, removeItem, clear }),
    [quantities, totalCount, addItem, setQuantity, removeItem, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
