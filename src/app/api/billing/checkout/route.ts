import { NextResponse } from "next/server";
import { PLANS, TRIAL_DAYS, isPlanId } from "@/lib/billing/plans";
import { siteUrl, stripe } from "@/lib/billing/stripe";
import {
  getOrCreateCustomer,
  hasLiveSubscription,
  trialEligible,
} from "@/lib/billing/customer";
import { getViewer } from "@/lib/entitlements-server";
import { safeNext } from "@/lib/safe-next";

export const runtime = "nodejs";

/**
 * Start a membership. Returns { url } — either Stripe Checkout, or the
 * Customer Portal for someone who already has a membership (plan changes
 * happen there, so nobody ends up paying for two plans at once).
 */
export async function POST(request: Request) {
  const { user } = await getViewer();
  if (!user) {
    return NextResponse.json({ error: "Sign in to subscribe." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    plan?: string;
    returnTo?: string;
  };
  if (!isPlanId(body.plan)) {
    return NextResponse.json({ error: "Unknown plan." }, { status: 400 });
  }
  const plan = PLANS[body.plan];
  const returnTo = safeNext(body.returnTo, "/account");

  try {
    const customer = await getOrCreateCustomer(user);

    // One membership per person: existing members change plan in the portal.
    if (await hasLiveSubscription(user.id)) {
      const portal = await stripe().billingPortal.sessions.create({
        customer,
        return_url: siteUrl(request, "/account"),
      });
      return NextResponse.json({ url: portal.url, portal: true });
    }

    const prices = await stripe().prices.list({
      lookup_keys: [plan.lookupKey],
      active: true,
      limit: 1,
    });
    const price = prices.data[0];
    if (!price) {
      return NextResponse.json(
        { error: `No active Stripe price for ${plan.lookupKey}.` },
        { status: 500 },
      );
    }

    const trial = await trialEligible(user.id, customer);

    const session = await stripe().checkout.sessions.create({
      mode: "subscription",
      customer,
      client_reference_id: user.id,
      line_items: [{ price: price.id, quantity: 1 }],
      // Card required even for the trial.
      payment_method_collection: "always",
      subscription_data: {
        metadata: { supabase_user_id: user.id, slwlrnr_plan: plan.id },
        ...(trial
          ? {
              trial_period_days: TRIAL_DAYS,
              trial_settings: { end_behavior: { missing_payment_method: "cancel" } },
            }
          : {}),
      },
      allow_promotion_codes: true,
      // Tax: Stripe is in threshold-monitoring mode, so automatic_tax stays
      // off. Turn it on here (automatic_tax: { enabled: true }) once a tax
      // registration exists — see docs/STRIPE.md.
      success_url: siteUrl(request, "/account?checkout=success"),
      cancel_url: siteUrl(request, returnTo),
    });

    if (!session.url) throw new Error("Checkout returned no URL.");
    return NextResponse.json({ url: session.url, trial });
  } catch (e) {
    console.error("[billing] checkout failed", e);
    return NextResponse.json(
      { error: "Couldn't start checkout. Please try again." },
      { status: 500 },
    );
  }
}
