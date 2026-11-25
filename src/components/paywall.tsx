"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { PLANS, TRIAL_DAYS, type PlanId } from "@/lib/billing/plans";
import { useSession } from "@/lib/session";
import { PRICING } from "@/lib/tiers";
import { Button, Rule } from "./ui";

/**
 * Membership prompt. `plan` is the section it sits in — "learn", or "create"
 * (whose membership is Studio). Every instance also offers the bundle.
 *
 * Signed out → sign in, then come back. Signed in → Stripe Checkout (the
 * server decides on the trial). Already a member → the server sends them to
 * the Customer Portal to change plan instead of starting a second
 * subscription.
 */
export function Paywall({
  plan,
  headline,
  points,
  compact = false,
}: {
  plan: "learn" | "create";
  headline: string;
  points: string[];
  compact?: boolean;
}) {
  const { user, entitlements } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [busy, setBusy] = useState<PlanId | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pricing = PRICING[plan];
  const planId: PlanId = plan === "learn" ? "learn" : "studio";
  const isMember = entitlements.learn || entitlements.create;

  async function start(id: PlanId) {
    if (!user) {
      router.push(`/signin?next=${encodeURIComponent(pathname)}`);
      return;
    }
    setBusy(id);
    setError(null);
    try {
      const r = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: id, returnTo: pathname }),
      });
      const data = await r.json();
      if (!r.ok || !data.url) throw new Error(data.error || "Couldn't start checkout.");
      window.location.href = data.url; // Stripe-hosted Checkout or Portal
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't start checkout.");
      setBusy(null);
    }
  }

  const primaryLabel = !user
    ? "Sign in to subscribe"
    : isMember
      ? `Switch to ${PLANS[planId].name}`
      : `Start ${TRIAL_DAYS}-day free trial`;

  const terms = isMember
    ? "Plan changes happen in billing — you'll keep what you've paid for."
    : `${TRIAL_DAYS} days free, then $${pricing.amount}/month. Cancel anytime before the trial ends and you won't be charged.`;

  const bundleLink = (
    <button
      onClick={() => start("bundle")}
      disabled={busy !== null}
      className="label link-underline mt-4 text-muted hover:text-ink disabled:opacity-40"
    >
      {busy === "bundle"
        ? "Opening…"
        : `Or both Learn + Studio — $${PLANS.bundle.amount}/month`}
    </button>
  );

  const errorLine = error && (
    <p className="mt-3 border-l border-ink pl-3 text-xs leading-relaxed text-ink">{error}</p>
  );

  if (compact) {
    return (
      <div className="border border-rule bg-wash p-6">
        <p className="label text-faint">
          {pricing.name} · ${pricing.amount}/{pricing.interval}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ink">{headline}</p>
        <Button className="mt-5 w-full" onClick={() => start(planId)} disabled={busy !== null}>
          {busy === planId ? "Opening…" : primaryLabel}
        </Button>
        <p className="mt-3 text-center text-[0.6875rem] leading-relaxed text-faint">{terms}</p>
        {user && <div className="text-center">{bundleLink}</div>}
        {errorLine}
      </div>
    );
  }

  return (
    <section className="border border-ink">
      <div className="grid lg:grid-cols-12">
        <div className="p-8 sm:p-12 lg:col-span-7">
          <p className="label text-faint">{pricing.name} membership</p>
          <h2 className="display mt-5 text-[2rem] sm:text-[2.5rem]">{headline}</h2>
          <ul className="mt-8">
            {points.map((p) => (
              <li
                key={p}
                className="flex gap-4 border-t border-rule py-3.5 text-sm leading-relaxed"
              >
                <span className="text-faint" aria-hidden>
                  —
                </span>
                <span className="text-muted">{p}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-rule bg-wash p-8 sm:p-12 lg:col-span-5 lg:border-l lg:border-t-0">
          <div className="flex items-baseline gap-2">
            <span className="display text-[3rem] tabular-nums">${pricing.amount}</span>
            <span className="label text-faint">/ {pricing.interval}</span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted">{pricing.blurb}</p>
          <Rule className="my-7" />
          <Button className="w-full" onClick={() => start(planId)} disabled={busy !== null}>
            {busy === planId ? "Opening…" : primaryLabel}
          </Button>
          <p className="mt-3 text-xs leading-relaxed text-faint">{terms}</p>
          {user && bundleLink}
          {errorLine}
        </div>
      </div>
    </section>
  );
}
