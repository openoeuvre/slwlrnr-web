/**
 * The three memberships. Shared by client and server — no secrets here.
 *
 * Stripe prices are found by LOOKUP KEY, never by price ID, so a price can be
 * changed in Stripe (new price, move the lookup key) without a deploy.
 * Mirrors docs/STRIPE.md.
 */

export type PlanId = "learn" | "studio" | "bundle";

export const PLANS: Record<
  PlanId,
  { id: PlanId; name: string; amount: number; lookupKey: string; grants: ("learn" | "studio")[] }
> = {
  learn: {
    id: "learn",
    name: "Learn",
    amount: 10,
    lookupKey: "slwlrnr_learn_monthly",
    grants: ["learn"],
  },
  studio: {
    id: "studio",
    name: "Studio",
    amount: 30,
    lookupKey: "slwlrnr_studio_monthly",
    grants: ["studio"],
  },
  bundle: {
    id: "bundle",
    name: "Learn + Studio",
    amount: 35,
    lookupKey: "slwlrnr_bundle_monthly",
    grants: ["learn", "studio"],
  },
};

export const TRIAL_DAYS = 7;

export function isPlanId(v: unknown): v is PlanId {
  return v === "learn" || v === "studio" || v === "bundle";
}

/** Which plan a Stripe lookup key belongs to. */
export function planForLookupKey(key: string | null | undefined): PlanId | null {
  const hit = Object.values(PLANS).find((p) => p.lookupKey === key);
  return hit ? hit.id : null;
}
