import { FREE_TIER, INFERENCE_URL, SOURCES, STUDIO, type Tier } from "@/lib/create/config";
import { getEntitlements } from "@/lib/entitlements-server";

export const runtime = "nodejs";
export const maxDuration = 300; // blends take 15–60 s; slower on MPS

/**
 * Runs a blend through the inference service.
 *
 * The tier comes from the SERVER-SIDE session, never the request. Anything
 * the client sends about tier is ignored — this is MERGE.md step 3, done.
 * The engine re-enforces the same rules (_shared.py) as a backstop; change
 * both together.
 */
export async function POST(req: Request) {
  const entitlements = await getEntitlements();
  if (!entitlements.account) {
    return Response.json(
      { error: "Create a free account to make your first blend." },
      { status: 401 },
    );
  }
  const tier: Tier = entitlements.create ? "premium" : "free";

  const form = await req.formData();
  const files = form.getAll("images").filter((f): f is File => f instanceof File);
  if (files.length < SOURCES.min || files.length > SOURCES.max) {
    return Response.json({ error: "Add two or three images." }, { status: 422 });
  }

  let system = (form.get("system") as string) || FREE_TIER.system;
  let numImages = parseInt((form.get("num_images") as string) || "1", 10) || 1;
  let lowres = true;
  const seed = form.get("seed") as string | null;
  const extra = form.get("extra_prompt") as string | null;

  if (tier === "free") {
    system = FREE_TIER.system;
    numImages = FREE_TIER.numImages;
    lowres = FREE_TIER.lowres;
  } else {
    numImages = Math.max(1, Math.min(numImages, STUDIO.maxImages));
    lowres = false;
  }

  const out = new FormData();
  for (const f of files) out.append("images", f, f.name || "source.png");
  out.append("system", system);
  out.append("tier", tier);
  out.append("num_images", String(numImages));
  out.append("lowres", String(lowres));
  if (seed && /^\d+$/.test(seed) && tier === "premium") out.append("seed", seed);
  if (extra && tier === "premium") out.append("extra_prompt", extra.slice(0, 200));

  try {
    const r = await fetch(`${INFERENCE_URL}/blend`, { method: "POST", body: out });
    if (!r.ok) {
      const detail = await r.text();
      return Response.json({ error: `Inference error: ${detail}` }, { status: r.status });
    }
    return Response.json(await r.json());
  } catch {
    return Response.json(
      { error: `Can't reach the inference service at ${INFERENCE_URL}. Is it running?` },
      { status: 502 },
    );
  }
}
