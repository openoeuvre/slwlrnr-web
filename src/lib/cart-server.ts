import "server-only";

/**
 * Cart operations against Shopify. SERVER ONLY.
 *
 * Shopify carts are stateful — `cartCreate` returns an id and a `checkoutUrl`,
 * and every later mutation needs that id. We keep it in an httpOnly cookie so
 * the browser never sees it and it survives a reload.
 *
 * Cart reads and writes are never cached: stock and totals must be live.
 */

import { cookies } from "next/headers";
import { storefront } from "./shopify";
import {
  CART_CREATE,
  CART_LINES_ADD,
  CART_LINES_REMOVE,
  CART_LINES_UPDATE,
  CART_QUERY,
} from "./shopify-queries";
import type { Cart } from "./commerce";

const COOKIE = "slwlrnr_cart";
/** Shopify abandons carts after 10 days of inactivity. */
const COOKIE_MAX_AGE = 60 * 60 * 24 * 10;

type SfMoney = { amount: string; currencyCode: string };

type SfCart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: { subtotalAmount: SfMoney; totalAmount: SfMoney };
  lines: {
    nodes: {
      id: string;
      quantity: number;
      merchandise: {
        id: string;
        title: string;
        price: SfMoney;
        selectedOptions: { name: string; value: string }[];
        image: {
          url: string;
          width: number | null;
          height: number | null;
          altText: string | null;
        } | null;
        product: { handle: string; title: string };
      };
    }[];
  };
};

function toCart(c: SfCart): Cart {
  return {
    id: c.id,
    checkoutUrl: c.checkoutUrl,
    totalQuantity: c.totalQuantity,
    subtotal: {
      amount: Number(c.cost.subtotalAmount.amount),
      currencyCode: "USD",
    },
    lines: c.lines.nodes.map((l) => ({
      id: l.id,
      quantity: l.quantity,
      merchandise: {
        id: l.merchandise.id,
        artworkSlug: l.merchandise.product.handle,
        productTitle: l.merchandise.product.title,
        variantTitle: l.merchandise.title,
        price: { amount: Number(l.merchandise.price.amount), currencyCode: "USD" },
        image: l.merchandise.image
          ? {
              url: l.merchandise.image.url,
              width: l.merchandise.image.width ?? 800,
              height: l.merchandise.image.height ?? 600,
              alt: l.merchandise.image.altText ?? l.merchandise.product.title,
            }
          : null,
      },
    })),
  };
}

async function cartId(): Promise<string | undefined> {
  return (await cookies()).get(COOKIE)?.value;
}

async function setCartId(id: string) {
  (await cookies()).set(COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

function firstError(errors: { message: string }[] | undefined) {
  if (errors?.length) throw new Error(errors[0].message);
}

/** Read the current cart, or null if there isn't one yet. */
export async function readCart(): Promise<Cart | null> {
  const id = await cartId();
  if (!id) return null;

  const data = await storefront<{ cart: SfCart | null }>(CART_QUERY, {
    variables: { id },
  });
  // Shopify expires carts. A stale cookie should behave as "no cart".
  return data.cart ? toCart(data.cart) : null;
}

export async function addLine(
  merchandiseId: string,
  quantity = 1,
): Promise<Cart> {
  const id = await cartId();
  const lines = [{ merchandiseId, quantity }];

  if (!id) {
    const data = await storefront<{
      cartCreate: { cart: SfCart; userErrors: { message: string }[] };
    }>(CART_CREATE, { variables: { lines } });
    firstError(data.cartCreate.userErrors);
    await setCartId(data.cartCreate.cart.id);
    return toCart(data.cartCreate.cart);
  }

  const data = await storefront<{
    cartLinesAdd: { cart: SfCart | null; userErrors: { message: string }[] };
  }>(CART_LINES_ADD, { variables: { cartId: id, lines } });
  firstError(data.cartLinesAdd.userErrors);

  // Cookie pointed at an expired cart — start a fresh one.
  if (!data.cartLinesAdd.cart) {
    const created = await storefront<{
      cartCreate: { cart: SfCart; userErrors: { message: string }[] };
    }>(CART_CREATE, { variables: { lines } });
    firstError(created.cartCreate.userErrors);
    await setCartId(created.cartCreate.cart.id);
    return toCart(created.cartCreate.cart);
  }

  return toCart(data.cartLinesAdd.cart);
}

export async function updateLine(
  lineId: string,
  quantity: number,
): Promise<Cart> {
  const id = await cartId();
  if (!id) throw new Error("No cart.");

  if (quantity <= 0) return removeLine(lineId);

  const data = await storefront<{
    cartLinesUpdate: { cart: SfCart; userErrors: { message: string }[] };
  }>(CART_LINES_UPDATE, {
    variables: { cartId: id, lines: [{ id: lineId, quantity }] },
  });
  firstError(data.cartLinesUpdate.userErrors);
  return toCart(data.cartLinesUpdate.cart);
}

export async function removeLine(lineId: string): Promise<Cart> {
  const id = await cartId();
  if (!id) throw new Error("No cart.");

  const data = await storefront<{
    cartLinesRemove: { cart: SfCart; userErrors: { message: string }[] };
  }>(CART_LINES_REMOVE, { variables: { cartId: id, lineIds: [lineId] } });
  firstError(data.cartLinesRemove.userErrors);
  return toCart(data.cartLinesRemove.cart);
}
