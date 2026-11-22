/**
 * Entitlements.
 *
 * Two independent subscriptions, not one ladder — a customer can hold either,
 * both, or neither. Modelling it as a set (rather than a single "tier" enum)
 * keeps the door open for bundling later without a migration.
 *
 * All limits live here so there is exactly one place to change the business
 * model. Nothing else in the app should hard-code a number.
 */

export type Entitlements = {
  /** Signed in at all. */
  account: boolean;
  /** $10/mo — full card library + high-resolution PDF downloads. */
  learn: boolean;
  /** $30/mo — all systems + upscale + high-resolution download. */
  create: boolean;
};

export const ANONYMOUS: Entitlements = {
  account: false,
  learn: false,
  create: false,
};

export const PRICING = {
  learn: {
    id: "learn",
    name: "Learn",
    amount: 10,
    interval: "month",
    blurb: "The full card library, every card's essay and glossary, print-ready PDFs.",
  },
  // Keyed "create" (the entitlement); sold as "Studio" — Create is the
  // section, Studio the membership, per slwlrnr-create/CLAUDE.md.
  create: {
    id: "create",
    name: "Studio",
    amount: 30,
    interval: "month",
    blurb: "Every natural system, four variations at once, seed and direction controls, full resolution.",
  },
} as const;

/**
 * Card counts are not here: each card in learn-cards.ts carries an explicit
 * `access` field, and counts are derived from that data on the server. Never
 * import learn-cards into a client component — it carries the paid essays.
 *
 * Create limits live in src/lib/create/config.ts.
 */

/* ------------------------------------------------------------------ */
/* Derived checks — import these rather than reading flags directly.   */
/* ------------------------------------------------------------------ */

/** Explicit per-card access — not array position. */
export function canReadCard(e: Entitlements, access: "free" | "paid"): boolean {
  return access === "free" || e.learn;
}

/** Free cards' PDFs are free too; everything else needs Learn. */
export function canDownloadPdf(e: Entitlements, access: "free" | "paid"): boolean {
  return canReadCard(e, access);
}

// Create tier rules live in src/lib/create/config.ts and are enforced in
// /api/create (and again by the engine). Not duplicated here.
