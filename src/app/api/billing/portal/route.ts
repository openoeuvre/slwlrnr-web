import { NextResponse } from "next/server";
import { existingCustomerId } from "@/lib/billing/customer";
import { siteUrl, stripe } from "@/lib/billing/stripe";
import { getViewer } from "@/lib/entitlements-server";

export const runtime = "nodejs";

/**
 * Open the Stripe Customer Portal for the signed-in user: change plan,
 * update card, see invoices, cancel. Uses the account's default portal
 * configuration ("SLWLRNR memberships" — see docs/STRIPE.md).
 */
export async function POST(request: Request) {
  const { user } = await getViewer();
  if (!user) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }

  const customer = await existingCustomerId(user.id);
  if (!customer) {
    return NextResponse.json({ error: "No billing account yet." }, { status: 404 });
  }

  try {
    const session = await stripe().billingPortal.sessions.create({
      customer,
      return_url: siteUrl(request, "/account"),
    });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("[billing] portal failed", e);
    return NextResponse.json(
      { error: "Couldn't open billing. Please try again." },
      { status: 500 },
    );
  }
}
