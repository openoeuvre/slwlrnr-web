import "server-only";

import { INFERENCE_URL } from "./config";
import type { SystemsResponse } from "./types";

export type EngineStatus =
  | { ok: true; catalogue: SystemsResponse }
  | { ok: false; url: string; reason: string; hint: string };

/**
 * The systems catalogue, straight from the engine. Display metadata only —
 * prompts never leave Python.
 *
 * On failure, says WHY, because "unreachable" has three different causes
 * with three different fixes:
 *
 *  - refused   nothing is listening. The engine isn't running, or is still
 *              loading — server.py loads the model BEFORE opening the port,
 *              so it refuses connections until "provider ready".
 *  - timeout   something is listening but not answering. Usually a blend is
 *              in progress: /blend runs synchronously and blocks the engine.
 *  - HTTP      it answered with an error.
 */
export async function getEngineStatus(): Promise<EngineStatus> {
  try {
    const r = await fetch(`${INFERENCE_URL}/systems`, {
      next: { revalidate: 300 },
      // Generous: a warm engine answers in milliseconds, but one mid-blend
      // may take several seconds to get back to us.
      signal: AbortSignal.timeout(10_000),
    });
    if (!r.ok) {
      return {
        ok: false,
        url: INFERENCE_URL,
        reason: `The engine answered with HTTP ${r.status}.`,
        hint:
          r.status === 503
            ? "The model is still loading. Wait for “provider ready” in the engine’s terminal."
            : "Check the engine’s terminal for an error.",
      };
    }
    return { ok: true, catalogue: (await r.json()) as SystemsResponse };
  } catch (e) {
    const msg = String((e as { cause?: { code?: string } })?.cause?.code ?? (e as Error)?.name ?? e);
    if (msg.includes("ECONNREFUSED")) {
      return {
        ok: false,
        url: INFERENCE_URL,
        reason: "Nothing is listening there.",
        hint: "Start the engine — or, if it is starting, wait for “provider ready”. The port only opens once the model has loaded.",
      };
    }
    if (msg.includes("Timeout") || msg.includes("Abort")) {
      return {
        ok: false,
        url: INFERENCE_URL,
        reason: "The engine is running but didn’t answer within 10 seconds.",
        hint: "It is probably mid-blend — the engine handles one request at a time. Reload when the blend finishes.",
      };
    }
    return {
      ok: false,
      url: INFERENCE_URL,
      reason: `Connection failed (${msg}).`,
      hint: "Check INFERENCE_URL in .env.local, then restart npm run dev.",
    };
  }
}

/** Convenience for pages that just want the list or nothing. */
export async function getSystems(): Promise<SystemsResponse | null> {
  const s = await getEngineStatus();
  return s.ok ? s.catalogue : null;
}
