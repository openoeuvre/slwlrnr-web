"use client";

import { usePathname, useRouter } from "next/navigation";
import { useSession } from "@/lib/session";
import { PRICING } from "@/lib/tiers";
import { Button, Rule } from "./ui";

/**
 * Subscription prompt. One component, two plans.
 * `compact` is for inline use (inside a locked card); the full version is the
 * end-of-page offer.
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
  const { user, devGrants, setDevGrant } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const pricing = PRICING[plan];

  // Until Stripe: signed-out visitors go to sign-in; signed-in testers get a
  // dev grant where enabled; otherwise the button waits for launch.
  // Real implementation: start Stripe Checkout for this plan.
  const canAct = !user || devGrants.enabled;
  function subscribe() {
    if (!user) {
      router.push(`/signin?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (devGrants.enabled) setDevGrant(plan === "learn" ? "learn" : "studio", true);
  }
  const buttonLabel = (full: string) =>
    !user ? "Sign in to subscribe" : devGrants.enabled ? full : "Opening soon";
  const footnote = !user
    ? "One account for the gallery, Learn and Create."
    : devGrants.enabled
      ? "Dev grant — Stripe isn't connected yet. Grants your account access for testing."
      : "Subscriptions open at launch.";

  if (compact) {
    return (
      <div className="border border-rule bg-wash p-6">
        <p className="label text-faint">
          {pricing.name} · ${pricing.amount}/{pricing.interval}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ink">{headline}</p>
        <Button className="mt-5 w-full" onClick={subscribe} disabled={!canAct}>
          {buttonLabel(`Subscribe — $${pricing.amount}/mo`)}
        </Button>
        <p className="mt-3 text-center text-[0.6875rem] text-faint">{footnote}</p>
      </div>
    );
  }

  return (
    <section className="border border-ink">
      <div className="grid lg:grid-cols-12">
        <div className="p-8 sm:p-12 lg:col-span-7">
          <p className="label text-faint">
            {pricing.name} subscription
          </p>
          <h2 className="display mt-5 text-[2rem] sm:text-[2.5rem]">
            {headline}
          </h2>
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
            <span className="display text-[3rem] tabular-nums">
              ${pricing.amount}
            </span>
            <span className="label text-faint">/ {pricing.interval}</span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            {pricing.blurb}
          </p>
          <Rule className="my-7" />
          <Button className="w-full" onClick={subscribe} disabled={!canAct}>
            {buttonLabel("Subscribe")}
          </Button>
          <p className="mt-3 text-xs leading-relaxed text-faint">{footnote}</p>
        </div>
      </div>
    </section>
  );
}
