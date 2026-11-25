import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/billing/stripe";
import { subscriptionIdFromInvoice, syncSubscription } from "@/lib/billing/sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Stripe → Supabase. The only writer of the `subscriptions` table.
 *
 * 1. Verify the signature against the RAW body — parsing JSON first would
 *    change the bytes and fail verification.
 * 2. Work out which subscription the event concerns.
 * 3. Re-fetch it from Stripe and upsert (see syncSubscription). Duplicate or
 *    out-of-order events are therefore harmless.
 *
 * Failed payments need no handling of their own: Stripe retries the card and
 * emails the customer (Dashboard → Revenue recovery), and the status change
 * to past_due / canceled arrives here via customer.subscription.updated.
 */
const HANDLED = new Set([
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.paid",
  "invoice.payment_failed",
]);

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[stripe] STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Webhook not configured." }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(body, signature, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  if (!HANDLED.has(event.type)) {
    return NextResponse.json({ received: true, ignored: event.type });
  }

  let subscriptionId: string | null = null;
  const obj = event.data.object as unknown;

  if (event.type === "checkout.session.completed") {
    const session = obj as Stripe.Checkout.Session;
    if (session.mode === "subscription" && session.subscription) {
      subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription.id;
    }
  } else if (event.type.startsWith("customer.subscription.")) {
    subscriptionId = (obj as Stripe.Subscription).id;
  } else if (event.type.startsWith("invoice.")) {
    subscriptionId = subscriptionIdFromInvoice(obj as Stripe.Invoice);
  }

  if (!subscriptionId) {
    return NextResponse.json({ received: true, skipped: "no subscription" });
  }

  try {
    await syncSubscription(subscriptionId);
  } catch (e) {
    console.error(`[stripe] ${event.type} ${event.id}:`, e);
    // 500 → Stripe retries with backoff for up to three days.
    return NextResponse.json({ error: "Sync failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
