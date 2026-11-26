import { NextResponse } from "next/server";
import { LIVE_STATUSES } from "@/lib/billing/customer";
import { stripe } from "@/lib/billing/stripe";
import { getViewer } from "@/lib/entitlements-server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Delete the signed-in user's account.
 *
 * 1. Cancel every live Stripe subscription immediately, so nobody is billed
 *    for an account that no longer exists. No refund of the current period
 *    (see the refund policy in the Terms).
 * 2. Detach the Stripe customer from us: clear its email and our user ID.
 *    The customer and its invoices stay in Stripe, because tax law requires
 *    payment records to be kept.
 * 3. Delete the Supabase user. profiles, subscriptions and create_usage all
 *    reference auth.users with ON DELETE CASCADE, so their rows go with it.
 *
 * Body must be { confirm: "delete" } — a guard against a stray request.
 */
export async function POST(request: Request) {
  const { user } = await getViewer();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { confirm?: string };
  if (body.confirm !== "delete") {
    return NextResponse.json({ error: "Confirmation missing." }, { status: 400 });
  }

  try {
    // Every Stripe customer tagged with this user (normally one).
    const found = await stripe().customers.search({
      query: `metadata['supabase_user_id']:'${user.id.replace(/[^a-f0-9-]/gi, "")}'`,
      limit: 10,
    });
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle();
    const customerIds = new Set(found.data.map((c) => c.id));
    if (profile?.stripe_customer_id) customerIds.add(profile.stripe_customer_id);

    for (const customer of customerIds) {
      const subs = await stripe().subscriptions.list({ customer, status: "all", limit: 100 });
      for (const s of subs.data) {
        if ((LIVE_STATUSES as readonly string[]).includes(s.status) || s.status === "unpaid" || s.status === "incomplete") {
          await stripe().subscriptions.cancel(s.id, {
            cancellation_details: { comment: "Account deleted by member" },
          });
        }
      }
      await stripe().customers.update(customer, {
        email: "",
        name: "",
        metadata: { supabase_user_id: "", deleted_account: "true" },
      });
    }

    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) throw error;

    // Clear the session cookies on this browser.
    await (await createClient()).auth.signOut().catch(() => {});

    return NextResponse.json({ deleted: true });
  } catch (e) {
    console.error("[account] delete failed", e);
    return NextResponse.json(
      { error: "Couldn't delete your account. Please try again, or contact us." },
      { status: 500 },
    );
  }
}
