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
// Decided: daily cap. Counted per user per UTC day in Supabase
// (create_usage, consume_free_blend). Only this object changes if the
// policy does — the route and interface read from it.
export type FreeTierMode = "one_blend" | "daily_cap" | "unlimited_lowres";

export const FREE_TIER = {
  mode: "daily_cap" as FreeTierMode, // decided — see docs/LAUNCH.md
  dailyCap: 5, // placeholder number; change freely
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
