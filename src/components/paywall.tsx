"use client";

import { MOCK_SESSION_ENABLED, useSession } from "@/lib/session";
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
  const { setPersona, persona } = useSession();
  const pricing = PRICING[plan];

  // Mock subscribe. Real implementation opens Stripe Checkout.
  function subscribe() {
    if (plan === "learn") setPersona(persona === "create" ? "both" : "learn");
    else setPersona(persona === "learn" ? "both" : "create");
  }

  if (compact) {
    return (
      <div className="border border-rule bg-wash p-6">
        <p className="label text-faint">
          {pricing.name} · ${pricing.amount}/{pricing.interval}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ink">{headline}</p>
        <Button className="mt-5 w-full" onClick={subscribe} disabled={!MOCK_SESSION_ENABLED}>
          {MOCK_SESSION_ENABLED ? `Subscribe — $${pricing.amount}/mo` : "Opening soon"}
        </Button>
        <p className="mt-3 text-center text-[0.6875rem] text-faint">
          {MOCK_SESSION_ENABLED
            ? "Mock subscribe. Stripe not connected in this build."
            : "Subscriptions open at launch."}
        </p>
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
          <Button className="w-full" onClick={subscribe} disabled={!MOCK_SESSION_ENABLED}>
            {MOCK_SESSION_ENABLED ? "Subscribe" : "Opening soon"}
          </Button>
          <p className="mt-3 text-xs leading-relaxed text-faint">
            {MOCK_SESSION_ENABLED
              ? "Cancel any time. Mock subscribe — Stripe is not connected in this build, but the entitlement state is real."
              : "Subscriptions open at launch."}
          </p>
        </div>
      </div>
    </section>
  );
}
