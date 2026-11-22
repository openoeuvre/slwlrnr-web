import { NextResponse, type NextRequest } from "next/server";

/**
 * Close the PDF paywall.
 *
 * The cards exporter writes PDFs to public/learn/pdf/, and Next.js serves
 * public/ to anyone. Middleware runs before static files, so every request
 * for a card PDF is rewritten to the API route, which checks entitlement
 * before streaming the file. Direct URLs to paid PDFs stop working.
 */
export function middleware(req: NextRequest) {
  const slug = req.nextUrl.pathname
    .replace(/^\/learn\/pdf\//, "")
    .replace(/\.pdf$/, "");
  const url = req.nextUrl.clone();
  url.pathname = `/api/learn/pdf/${slug}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: "/learn/pdf/:path*",
};
