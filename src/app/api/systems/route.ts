import { INFERENCE_URL } from "@/lib/create/config";

export const runtime = "nodejs";

/** Proxies the engine's systems catalogue. */
export async function GET() {
  try {
    const r = await fetch(`${INFERENCE_URL}/systems`, { cache: "no-store" });
    if (!r.ok) {
      return Response.json({ error: "Catalogue unavailable." }, { status: r.status });
    }
    return Response.json(await r.json());
  } catch {
    return Response.json(
      { error: `Can't reach the inference service at ${INFERENCE_URL}. Start it and reload.` },
      { status: 502 },
    );
  }
}
