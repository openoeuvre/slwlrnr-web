/**
 * Cart types, shared between server and client.
 *
 * Intentionally free of any Shopify import so client components can use these
 * without dragging the private token anywhere near the browser bundle. The
 * mapping from Shopify's cart shape lives in `cart-server.ts`.
 */

export type Money = { amount: number; currencyCode: "USD" };

export type LineImage = {
  url: string;
  width: number;
  height: number;
  alt: string;
};

export type Merchandise = {
  /** Shopify ProductVariant GID. */
  id: string;
  artworkSlug: string;
  productTitle: string;
  /** The variant name, e.g. "Ready to hang". */
  variantTitle: string;
  price: Money;
  image: LineImage | null;
};

export type CartLine = {
  id: string;
  quantity: number;
  merchandise: Merchandise;
};

export type Cart = {
  id: string;
  lines: CartLine[];
  totalQuantity: number;
  subtotal: Money;
  /** Shopify's hosted checkout. */
  checkoutUrl: string;
};

export const EMPTY_CART: Cart = {
  id: "",
  lines: [],
  totalQuantity: 0,
  subtotal: { amount: 0, currencyCode: "USD" },
  checkoutUrl: "",
};

export function formatMoney(m: Money): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: m.currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(m.amount);
}

export function formatUSD(amount: number): string {
  return formatMoney({ amount, currencyCode: "USD" });
}
