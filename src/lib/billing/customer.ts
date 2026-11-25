import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "./stripe";

/** Stripe statuses that still hold access — and still count as "has a membership". */
export const LIVE_STATUSES = ["active", "trialing", "past_due"] as const;

/**
 * The user's Stripe customer, created on first use and remembered on their
 * profile. The idempotency key means two simultaneous clicks can't create two
 * customers.
 */
export async function getOrCreateCustomer(user: {
  id: string;
  email: string | null;
}): Promise<string> {
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.stripe_customer_id) return profile.stripe_customer_id;

  const customer = await stripe().customers.create(
    {
      email: user.email ?? undefined,
      metadata: { supabase_user_id: user.id },
    },
    { idempotencyKey: `slwlrnr-customer-${user.id}` },
  );

  await admin
    .from("profiles")
    .update({ stripe_customer_id: customer.id })
    .eq("id", user.id);

  return customer.id;
}

export async function existingCustomerId(userId: string): Promise<string | null> {
  const { data } = await createAdminClient()
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", userId)
    .maybeSingle();
  return data?.stripe_customer_id ?? null;
}

/** Does this user already hold a membership (any plan)? */
export async function hasLiveSubscription(userId: string): Promise<boolean> {
  const { data } = await createAdminClient()
    .from("subscriptions")
    .select("id")
    .eq("user_id", userId)
    .in("status", [...LIVE_STATUSES])
    .limit(1);
  return (data?.length ?? 0) > 0;
}

/** One free trial per person: anyone who has ever subscribed has had theirs. */
export async function trialEligible(userId: string, customerId: string): Promise<boolean> {
  const { data } = await createAdminClient()
    .from("subscriptions")
    .select("id")
    .eq("user_id", userId)
    .limit(1);
  if ((data?.length ?? 0) > 0) return false;

  // Belt and braces: ask Stripe too, in case a webhook was missed.
  const prior = await stripe().subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 1,
  });
  return prior.data.length === 0;
}
