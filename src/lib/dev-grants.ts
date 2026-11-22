/**
 * DEV GRANTS — testing paid features before Stripe exists.
 *
 * Accounts are real (Supabase). Memberships will come from Stripe. Until
 * then, a signed-in tester can grant their own account Learn or Studio
 * through the dev switcher. Grants are a cookie read server-side, layered on
 * top of real subscriptions.
 *
 * Enabled in `npm run dev`. In any production build (every Vercel
 * deployment) they are IGNORED unless NEXT_PUBLIC_ENABLE_DEV_GRANTS is
 * "true" — set that only on a protected environment. Delete this module once
 * Stripe is live.
 */

export const DEV_GRANTS_COOKIE = "slwlrnr_dev_grants";

export type DevGrant = "learn" | "studio";

export const DEV_GRANTS_ENABLED =
  process.env.NODE_ENV !== "production" ||
  process.env.NEXT_PUBLIC_ENABLE_DEV_GRANTS === "true";

export function parseGrants(value: string | undefined | null): Set<DevGrant> {
  const out = new Set<DevGrant>();
  if (!DEV_GRANTS_ENABLED || !value) return out;
  for (const part of decodeURIComponent(value).split(",")) {
    if (part === "learn" || part === "studio") out.add(part);
  }
  return out;
}
