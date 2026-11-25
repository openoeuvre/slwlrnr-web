import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Container } from "@/components/container";
import { Note, PageHeader, Rule, SpecRow } from "@/components/ui";
import { existingCustomerId, reconcileCustomer } from "@/lib/billing/customer";
import { PLANS, isPlanId } from "@/lib/billing/plans";
import { freeBlendsUsedToday, freeCap, freeCapApplies } from "@/lib/create/usage-server";
import { getViewer } from "@/lib/entitlements-server";
import { createClient } from "@/lib/supabase/server";
import { ManageBillingButton } from "./manage-billing-button";
import { SignOutButton } from "./sign-out-button";

export const metadata: Metadata = { title: "Account" };
export const dynamic = "force-dynamic";

const fmt = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : null;

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const { user, entitlements } = await getViewer();
  if (!user) redirect("/signin?next=/account");
  const { checkout } = await searchParams;

  // The current membership, as last written by the Stripe webhook.
  const supabase = await createClient();
  const readRows = () =>
    supabase
      .from("subscriptions")
      .select("product, status, trial_end, current_period_end, cancel_at_period_end, stripe_customer_id")
      .order("updated_at", { ascending: false });
  const isLive = (r: { status: string }) => ["active", "trialing", "past_due"].includes(r.status);

  let { data: rows } = await readRows();
  let reconcileFailed = false;

  // Back from Checkout but the webhook hasn't landed (or isn't arriving):
  // ask Stripe directly rather than make the new member wait.
  if (checkout === "success" && !(rows ?? []).some(isLive)) {
    try {
      const customerId = await existingCustomerId(user.id);
      if (customerId) {
        await reconcileCustomer(customerId);
        ({ data: rows } = await readRows());
      }
    } catch (e) {
      reconcileFailed = true;
      console.error("[billing] reconcile on return from checkout failed", e);
    }
  }

  const live = (rows ?? []).find(isLive);
  const hasBillingAccount = (rows ?? []).some((r) => r.stripe_customer_id);

  const usage =
    !entitlements.create && freeCapApplies()
      ? { used: await freeBlendsUsedToday(), cap: freeCap() }
      : null;

  const plan = live && isPlanId(live.product) ? PLANS[live.product] : null;

  let state: string | null = null;
  if (live) {
    if (live.status === "past_due") {
      state = "Your last payment didn't go through. Update your card in billing to keep access.";
    } else if (live.status === "trialing") {
      state = live.cancel_at_period_end
        ? `Free trial — ends ${fmt(live.trial_end)}. You won't be charged.`
        : `Free trial — ends ${fmt(live.trial_end)}, then $${plan?.amount}/month.`;
    } else {
      state = live.cancel_at_period_end
        ? `Cancelled — access continues until ${fmt(live.current_period_end)}.`
        : `Renews ${fmt(live.current_period_end)} at $${plan?.amount}/month.`;
    }
  }

  return (
    <Container>
      <PageHeader eyebrow="Account" title={user.email ?? "Your account"} />

      {checkout === "success" && (
        <div className="-mt-4 mb-10">
          <Note>
            Welcome. {live
              ? "Your membership is active."
              : reconcileFailed
                ? "Your payment went through, but we couldn't load your membership. Refresh in a moment — if it still doesn't appear, contact us and we'll sort it out."
                : "Your membership is being set up — this usually takes a few seconds. Refresh if it doesn't appear."}
          </Note>
        </div>
      )}

      <section className="pb-8">
        <h2 className="label text-faint">Membership</h2>

        {plan ? (
          <div className="mt-4 border border-rule p-7">
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="text-lg">{plan.name}</h3>
              <span className="label text-ink">
                {live?.status === "trialing" ? "Trial" : live?.status === "past_due" ? "Payment due" : "Active"}
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted">{state}</p>
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
              <ManageBillingButton />
              {plan.id !== "bundle" && (
                <span className="text-xs text-faint">
                  Switch plans, update your card or cancel in billing.
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-4 grid gap-px bg-rule sm:grid-cols-3">
            {(["learn", "studio", "bundle"] as const).map((id) => (
              <div key={id} className="bg-paper p-6">
                <h3 className="text-[0.9375rem]">{PLANS[id].name}</h3>
                <p className="label mt-2 text-faint tabular-nums">${PLANS[id].amount} / month</p>
                <Link
                  href={id === "learn" ? "/learn" : "/create"}
                  className="label link-underline mt-5 inline-block text-ink"
                >
                  {id === "bundle" ? "See both" : `See ${PLANS[id].name}`}
                </Link>
              </div>
            ))}
          </div>
        )}

        {!plan && hasBillingAccount && (
          <div className="mt-4">
            <ManageBillingButton label="Past invoices" />
          </div>
        )}

        {usage && (
          <p className="mt-5 text-xs leading-relaxed text-faint">
            Free Create: {Math.max(0, usage.cap - usage.used)} of {usage.cap} blends left today.
          </p>
        )}
      </section>

      <section className="pb-8 pt-10">
        <h2 className="label text-faint">Orders</h2>
        <p className="mt-4 text-sm text-muted">
          Print orders are confirmed by email from the SLWLRNR shop, with tracking once they ship.
        </p>
      </section>

      <Rule className="my-10" />

      <section className="pb-24">
        <dl className="max-w-md">
          <SpecRow label="Signed in as">{user.email}</SpecRow>
        </dl>
        <div className="mt-6">
          <SignOutButton />
        </div>
      </section>
    </Container>
  );
}
