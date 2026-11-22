"use client";

/**
 * Cart context. Talks to /api/cart, never to Shopify.
 *
 * Every mutation returns the authoritative cart from Shopify, so local state
 * is always a mirror rather than a guess — no optimistic drift, and stock
 * rejections surface immediately.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { EMPTY_CART, type Cart } from "./commerce";

type CartValue = {
  cart: Cart;
  open: boolean;
  setOpen: (v: boolean) => void;
  busy: boolean;
  error: string | null;
  add: (merchandiseId: string, quantity?: number) => Promise<void>;
  update: (lineId: string, quantity: number) => Promise<void>;
  remove: (lineId: string) => Promise<void>;
};

const CartContext = createContext<CartValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart>(EMPTY_CART);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hydrate after mount so server and first client render agree.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/cart")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && d.cart) setCart(d.cart);
      })
      .catch(() => {
        /* an empty cart on load is not worth surfacing */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const send = useCallback(
    async (method: "POST" | "PATCH" | "DELETE", body: unknown) => {
      setBusy(true);
      setError(null);
      try {
        const res = await fetch("/api/cart", {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
        setCart(data.cart);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
        throw e;
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  const add = useCallback(
    async (merchandiseId: string, quantity = 1) => {
      await send("POST", { merchandiseId, quantity });
      setOpen(true);
    },
    [send],
  );

  const update = useCallback(
    async (lineId: string, quantity: number) => {
      await send("PATCH", { lineId, quantity });
    },
    [send],
  );

  const remove = useCallback(
    async (lineId: string) => {
      await send("DELETE", { lineId });
    },
    [send],
  );

  const value = useMemo(
    () => ({ cart, open, setOpen, busy, error, add, update, remove }),
    [cart, open, busy, error, add, update, remove],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
