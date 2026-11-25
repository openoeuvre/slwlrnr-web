import "server-only";

import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { planForLookupKey, isPlanId } from "./plans";
import { stripe } from "./stripe";

/**
 * Bring one subscription's row in Supabase up to date with Stripe.
 *
 * Always RE-FETCHES the subscription rather than trusting the event payload.
 * Stripe can deliver events late, twice, or out of order; reading the current
 * state and upserting by subscription ID makes every call idempotent and
 * order-independent. Throws on failure so the webhook returns 500 and Stripe
 * retries.
 */
export async function syncSubscription(subscriptionId: string): Promise<void> {
  const sub = await stripe().subscriptions.retrieve(subscriptionId, {
    expand: ["items.data.price"],
  });

  const item = sub.items.data[0];
  const price = item?.price;
  const product =
    planForLookupKey(price?.lookup_key) ??
    (isPlanId(price?.metadata?.slwlrnr_plan) ? price.metadata.slwlrnr_plan : null);
  if (!product) {
    // Not one of ours (e.g. a test object made in the dashboard). Ignore.
    console.warn(`[billing] subscription ${sub.id} has no SLWLRNR plan; skipped`);
    return;
  }

  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const admin = createAdminClient();

  // Who is this? Set on the subscription at Checkout; fall back to the
  // customer ID stored on the profile.
  let userId: string | null = sub.metadata?.supabase_user_id ?? null;
  if (!userId) {
    const { data } = await admin
      .from("profiles")
      .select("id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();
    userId = data?.id ?? null;
  }
  if (!userId) {
    throw new Error(`[billing] no SLWLRNR user for subscription ${sub.id} (customer ${customerId})`);
  }

  // Billing periods moved from the subscription onto its items in recent
  // Stripe API versions; read whichever is present.
  const periodEnd =
    (item as unknown as { current_period_end?: number })?.current_period_end ??
    (sub as unknown as { current_period_end?: number }).current_period_end ??
    null;

  const toIso = (t: number | null | undefined) => (t ? new Date(t * 1000).toISOString() : null);

  const { error } = await admin.from("subscriptions").upsert(
    {
      user_id: userId,
      product,
      status: sub.status,
      current_period_end: toIso(periodEnd),
      trial_end: toIso(sub.trial_end),
      cancel_at_period_end: Boolean(sub.cancel_at_period_end || sub.cancel_at),
      stripe_subscription_id: sub.id,
      stripe_customer_id: customerId,
      stripe_price_id: price?.id ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "stripe_subscription_id" },
  );
  if (error) throw new Error(`[billing] upsert failed for ${sub.id}: ${error.message}`);
}

/** The subscription an invoice belongs to, across Stripe API versions. */
export function subscriptionIdFromInvoice(invoice: Stripe.Invoice): string | null {
  const parent = (invoice as unknown as {
    parent?: { subscription_details?: { subscription?: string | { id: string } } };
  }).parent;
  const fromParent = parent?.subscription_details?.subscription;
  const legacy = (invoice as unknown as { subscription?: string | { id: string } }).subscription;
  const raw = fromParent ?? legacy;
  if (!raw) return null;
  return typeof raw === "string" ? raw : raw.id;
}
