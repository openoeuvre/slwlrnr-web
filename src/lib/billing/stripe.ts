import "server-only";

import Stripe from "stripe";

/** Server-side Stripe client. The secret key never reaches the browser. */
let client: Stripe | null = null;

export function stripe(): Stripe {
  if (client) return client;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set.");
  client = new Stripe(key, {
    appInfo: { name: "slwlrnr-web" },
  });
  return client;
}

/** Absolute URL for redirects back to the site (works locally and on Vercel). */
export function siteUrl(request: Request, path: string): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  const base = configured || new URL(request.url).origin;
  return new URL(path, base).toString();
}
