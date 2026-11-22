import { NextResponse } from "next/server";
import {
  addLine,
  readCart,
  removeLine,
  updateLine,
} from "@/lib/cart-server";
import { EMPTY_CART } from "@/lib/commerce";

/**
 * Cart endpoints.
 *
 * The client never talks to Shopify directly — it posts here, and this runs
 * server-side where the private Storefront token lives. That is the whole
 * reason the cart moved off the client.
 */

export const dynamic = "force-dynamic";

function fail(e: unknown) {
  const message = e instanceof Error ? e.message : "Cart operation failed.";
  console.error("[api/cart]", message);
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function GET() {
  try {
    return NextResponse.json({ cart: (await readCart()) ?? EMPTY_CART });
  } catch (e) {
    return fail(e);
  }
}

export async function POST(request: Request) {
  try {
    const { merchandiseId, quantity } = (await request.json()) as {
      merchandiseId?: string;
      quantity?: number;
    };
    if (!merchandiseId) {
      return NextResponse.json(
        { error: "merchandiseId is required." },
        { status: 400 },
      );
    }
    return NextResponse.json({
      cart: await addLine(merchandiseId, quantity ?? 1),
    });
  } catch (e) {
    return fail(e);
  }
}

export async function PATCH(request: Request) {
  try {
    const { lineId, quantity } = (await request.json()) as {
      lineId?: string;
      quantity?: number;
    };
    if (!lineId || typeof quantity !== "number") {
      return NextResponse.json(
        { error: "lineId and quantity are required." },
        { status: 400 },
      );
    }
    return NextResponse.json({ cart: await updateLine(lineId, quantity) });
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(request: Request) {
  try {
    const { lineId } = (await request.json()) as { lineId?: string };
    if (!lineId) {
      return NextResponse.json(
        { error: "lineId is required." },
        { status: 400 },
      );
    }
    return NextResponse.json({ cart: await removeLine(lineId) });
  } catch (e) {
    return fail(e);
  }
}
