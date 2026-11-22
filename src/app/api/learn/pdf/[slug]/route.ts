import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getEntitlements } from "@/lib/entitlements-server";
import { cardBySlug } from "@/lib/learn";
import { canDownloadPdf } from "@/lib/tiers";

/**
 * Gated card PDF download. Reached via middleware rewrite of
 * /learn/pdf/<slug>.pdf, so the public URL stays tidy but is never served
 * straight from disk.
 *
 * On Vercel the files are bundled into this function via
 * outputFileTracingIncludes in next.config.mjs.
 */
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const card = cardBySlug(slug);
  if (!card) return new NextResponse("Not found", { status: 404 });

  const entitlements = await getEntitlements();
  if (!canDownloadPdf(entitlements, card.access)) {
    return new NextResponse(
      "This card's PDF is included with the Learn subscription.",
      { status: 403 },
    );
  }

  // Resolve from the card record, never from the raw URL, so the slug cannot
  // be used to reach any other file.
  const file = path.join(process.cwd(), "public", card.pdf.replace(/^\//, ""));
  try {
    const body = await readFile(file);
    return new NextResponse(new Uint8Array(body), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="SLWLRNR-${card.id}-${card.slug}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return new NextResponse("PDF not found — re-run npm run cards:export.", {
      status: 404,
    });
  }
}
