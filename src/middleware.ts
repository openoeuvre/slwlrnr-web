import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Two jobs:
 *
 * 1. Keep the Supabase session fresh. Access tokens expire; refreshing here,
 *    before any page renders, is what @supabase/ssr requires so server
 *    components always see a valid session.
 *
 * 2. Close the PDF paywall. Card PDFs live in public/learn/pdf/, which Next
 *    serves to anyone. Every request for one is rewritten to the API route,
 *    which checks entitlement before streaming the file.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const target = pathname.startsWith("/learn/pdf/")
    ? (() => {
        const url = request.nextUrl.clone();
        url.pathname = `/api/learn/pdf/${pathname
          .replace(/^\/learn\/pdf\//, "")
          .replace(/\.pdf$/, "")}`;
        return url;
      })()
    : null;

  const respond = () =>
    target
      ? NextResponse.rewrite(target, { request })
      : NextResponse.next({ request });

  let response = respond();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(toSet) {
        toSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = respond();
        toSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // Do not remove: this call is what refreshes an expired session.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  // Everything except static assets, images, and the Stripe webhook (Stripe
  // has no session to refresh, and the webhook must see the raw request).
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|brand/|rooms/|learn/img/|api/stripe/webhook|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
