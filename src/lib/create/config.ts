/**
 * Create — configuration.
 *
 * Ported from slwlrnr-create/web/lib/config.ts. The natural systems
 * themselves are NOT here and must never be: they live only in Python
 * (inference/slwlrnr_blend/systems.py) and are fetched from /systems.
 */

/** The FastAPI inference service. Local on MPS now; a Modal URL in production. */
export const INFERENCE_URL = process.env.INFERENCE_URL ?? "http://127.0.0.1:8010";

// --- The open free-tier decision, as one switch ------------------------------
// Not locked yet. Whichever way it lands, only this object changes — the
// interface and gating read from it. `one_blend` and `daily_cap` need real
// per-user counting, which arrives with Supabase; until then they are advisory.
export type FreeTierMode = "one_blend" | "daily_cap" | "unlimited_lowres";

export const FREE_TIER = {
  mode: "unlimited_lowres" as FreeTierMode,
  dailyCap: 5,
  system: "signature", // free is locked to the Signature process
  numImages: 1, // one output per blend on free
  lowres: true, // free outputs are delivered low-resolution (640 px)
};

export const STUDIO = {
  maxImages: 4,
};

export const SOURCES = { min: 2, max: 3 };

/** The engine's tier names. Studio membership maps to "premium". */
export type Tier = "free" | "premium";
