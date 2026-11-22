import "server-only";

/**
 * Storefront API client. SERVER ONLY.
 *
 * The `server-only` import above is load-bearing: it makes the build fail if
 * this module is ever pulled into a client component. The token is a private
 * (`shpa_`) delegate token and must never reach the browser.
 *
 * Why private rather than public: public tokens are rate-limited per IP.
 * We render product pages on the server, so every request would come from one
 * IP and hit the ceiling under load. Private tokens are built for this.
 */

const DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const TOKEN = process.env.SHOPIFY_STOREFRONT_TOKEN;
const VERSION = process.env.SHOPIFY_STOREFRONT_API_VERSION ?? "2026-04";

export class ShopifyError extends Error {
  constructor(
    message: string,
    readonly detail?: unknown,
  ) {
    super(message);
    this.name = "ShopifyError";
  }
}

function endpoint(): string {
  if (!DOMAIN || !TOKEN) {
    throw new ShopifyError(
      "Shopify is not configured. Set SHOPIFY_STORE_DOMAIN and SHOPIFY_STOREFRONT_TOKEN in .env.local, then restart the dev server.",
    );
  }
  return `https://${DOMAIN}/api/${VERSION}/graphql.json`;
}

type Options = {
  variables?: Record<string, unknown>;
  /** Seconds. Omit for uncached (cart mutations must not be cached). */
  revalidate?: number;
  tags?: string[];
};

export async function storefront<T>(
  query: string,
  { variables, revalidate, tags }: Options = {},
): Promise<T> {
  const res = await fetch(endpoint(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Private/delegate tokens use this header. A public token would use
      // X-Shopify-Storefront-Access-Token instead.
      "Shopify-Storefront-Private-Token": TOKEN as string,
    },
    body: JSON.stringify({ query, variables }),
    ...(revalidate === undefined
      ? { cache: "no-store" as const }
      : { next: { revalidate, tags } }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new ShopifyError(
      `Storefront API returned ${res.status}. ${
        res.status === 401 || res.status === 403
          ? "Check the token is a private Storefront token and that the required unauthenticated_* permissions are enabled on the Headless channel."
          : ""
      }`,
      body.slice(0, 500),
    );
  }

  const json = (await res.json()) as {
    data?: T;
    errors?: { message: string }[];
  };

  if (json.errors?.length) {
    throw new ShopifyError(
      `Storefront API error: ${json.errors.map((e) => e.message).join("; ")}`,
      json.errors,
    );
  }
  if (!json.data) throw new ShopifyError("Storefront API returned no data.");

  return json.data;
}

export const shopifyConfigured = Boolean(DOMAIN && TOKEN);
