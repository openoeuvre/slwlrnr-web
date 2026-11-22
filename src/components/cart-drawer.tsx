"use client";

import { useEffect } from "react";
import { useCart } from "@/lib/cart";
import { formatMoney, formatUSD } from "@/lib/commerce";
import { ArtworkImage } from "./artwork-image";
import { Button, Rule } from "./ui";

export function CartDrawer() {
  const { cart, open, setOpen, remove, update, busy, error } = useCart();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);

  return (
    <>
      <div
        onClick={() => setOpen(false)}
        aria-hidden
        className={`fixed inset-0 z-40 bg-ink/15 transition-opacity duration-200 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        aria-label="Cart"
        className={`fixed right-0 top-0 z-50 flex h-dvh w-full max-w-[26rem] flex-col border-l border-rule bg-paper transition-transform duration-[250ms] ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-rule px-5 py-4">
          <h2 className="label">Cart ({cart.totalQuantity})</h2>
          <button
            onClick={() => setOpen(false)}
            className="label text-muted hover:text-ink"
          >
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5">
          {cart.lines.length === 0 ? (
            <p className="py-10 text-sm text-muted">Nothing selected yet.</p>
          ) : (
            <ul>
              {cart.lines.map((line) => (
                <li key={line.id} className="flex gap-4 border-b border-rule py-5">
                  <div className="h-16 w-20 shrink-0 overflow-hidden bg-wash">
                    {line.merchandise.image && (
                      <ArtworkImage
                        image={line.merchandise.image}
                        alt=""
                        sizes="80px"
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-snug">
                      {line.merchandise.productTitle}
                    </p>
                    <p className="label mt-1.5 text-faint">
                      {line.merchandise.variantTitle}
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center border border-rule">
                        <button
                          onClick={() => update(line.id, line.quantity - 1)}
                          disabled={busy}
                          className="h-7 w-7 text-sm text-muted hover:text-ink disabled:opacity-40"
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="w-6 text-center text-xs tabular-nums">
                          {line.quantity}
                        </span>
                        <button
                          onClick={() => update(line.id, line.quantity + 1)}
                          disabled={busy}
                          className="h-7 w-7 text-sm text-muted hover:text-ink disabled:opacity-40"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-sm tabular-nums">
                        {formatUSD(
                          line.merchandise.price.amount * line.quantity,
                        )}
                      </span>
                    </div>
                    <button
                      onClick={() => remove(line.id)}
                      disabled={busy}
                      className="label mt-3 text-faint hover:text-ink disabled:opacity-40"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {error && (
            <p className="mt-5 border-l border-ink pl-4 text-xs leading-relaxed text-ink">
              {error}
            </p>
          )}
        </div>

        <div className="border-t border-rule px-5 py-5">
          <div className="flex items-baseline justify-between">
            <span className="label text-faint">Subtotal</span>
            <span className="text-lg tabular-nums">
              {formatMoney(cart.subtotal)}
            </span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-faint">
            Shipping and tax calculated at checkout.
          </p>
          <Rule className="my-4" />
          {/* Hands off to Shopify's hosted checkout. */}
          <Button
            className="w-full"
            disabled={cart.lines.length === 0 || !cart.checkoutUrl || busy}
            onClick={() => {
              if (cart.checkoutUrl) window.location.href = cart.checkoutUrl;
            }}
          >
            {busy ? "Updating…" : "Checkout"}
          </Button>
          <p className="mt-3 text-center text-[0.6875rem] text-faint">
            Secure checkout by Shopify.
          </p>
        </div>
      </aside>
    </>
  );
}
