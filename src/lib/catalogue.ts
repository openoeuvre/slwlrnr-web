import "server-only";

/**
 * Shopify → Artwork mapping.
 *
 * This is the only place that knows Shopify's response shape. Everything
 * downstream consumes the `Artwork` type, which is why swapping the hardcoded
 * catalogue for live queries touched nothing in the components.
 */

import { storefront } from "./shopify";
import { PRODUCTS_QUERY, PRODUCT_QUERY } from "./shopify-queries";
import type { Artwork, FormatId, Variant } from "@/data/artworks";

/** Cache window for catalogue reads. Prices and stock change rarely. */
const REVALIDATE = 300;

type SfImage = {
  url: string;
  width: number | null;
  height: number | null;
  altText: string | null;
} | null;

type SfProduct = {
  id: string;
  handle: string;
  title: string;
  description: string;
  vendor: string;
  productType: string;
  featuredImage: SfImage;
  widthMf: { value: string } | null;
  heightMf: { value: string } | null;
  editionMf: { value: string } | null;
  mediumMf: { value: string } | null;
  seriesMf: { value: string } | null;
  variants: {
    nodes: {
      id: string;
      title: string;
      availableForSale: boolean;
      quantityAvailable: number | null;
      price: { amount: string; currencyCode: string };
      selectedOptions: { name: string; value: string }[];
    }[];
  };
};

/**
 * Shopify option values → our internal format ids.
 * Keep in sync with the Format option values in the admin.
 */
const FORMAT_BY_OPTION: Record<string, FormatId> = {
  "ready to hang": "ready",
  "print, rolled": "rolled",
  print: "rolled",
};

/** `dimension` metafields arrive as JSON: {"value":48.0,"unit":"INCHES"} */
function parseDimensionInches(raw: string | undefined, label: string): number {
  if (!raw) return 0;
  try {
    const { value, unit } = JSON.parse(raw) as { value: number; unit: string };
    switch (unit) {
      case "INCHES":
        return value;
      case "CENTIMETERS":
        return value / 2.54;
      case "FEET":
        return value * 12;
      case "MILLIMETERS":
        return value / 25.4;
      default:
        warn(`${label}: unrecognised unit "${unit}", treating as inches`);
        return value;
    }
  } catch {
    warn(`${label}: could not parse dimension metafield`);
    return 0;
  }
}

function warn(msg: string) {
  // Server-side only; surfaces missing store data during development.
  console.warn(`[catalogue] ${msg}`);
}

function toArtwork(p: SfProduct): Artwork {
  const variants: Variant[] = p.variants.nodes
    .map((v) => {
      const opt = v.selectedOptions.find((o) => o.name === "Format")?.value;
      const format = opt ? FORMAT_BY_OPTION[opt.toLowerCase()] : undefined;
      if (!format) {
        warn(
          `${p.handle}: variant "${v.title}" has Format "${opt ?? "none"}" which is not mapped — skipping`,
        );
        return null;
      }
      return {
        format,
        id: v.id,
        price: Number(v.price.amount),
        available: v.quantityAvailable ?? (v.availableForSale ? 1 : 0),
      };
    })
    .filter((v): v is Variant => v !== null);

  if (variants.length === 0) warn(`${p.handle}: no usable variants`);
  if (!p.featuredImage) warn(`${p.handle}: no featured image`);
  if (!p.widthMf || !p.heightMf)
    warn(`${p.handle}: missing artwork_width/artwork_height metafield`);

  // Series: prefer an explicit metafield, else the part of the title before
  // the separator ("Nova -- landscape 001" → "Nova"), else the vendor.
  //
  // Handles double-hyphen, em dash, en dash, and spaced single hyphen, because
  // the store currently uses "--" and that will not stay consistent forever.
  // If title conventions drift, add a custom.series metafield and this stops
  // guessing entirely.
  const series =
    p.seriesMf?.value?.trim() ||
    (p.title.split(/\s+(?:--+|[—–]|-)\s+/)[0] || "").trim() ||
    p.vendor;

  const img = p.featuredImage;

  return {
    id: p.id,
    slug: p.handle,
    title: p.title,
    series,
    description: p.description,
    widthIn: parseDimensionInches(p.widthMf?.value, `${p.handle} width`),
    heightIn: parseDimensionInches(p.heightMf?.value, `${p.handle} height`),
    editionSize: p.editionMf ? Number(p.editionMf.value) : 0,
    medium: p.mediumMf?.value ?? "",
    image: {
      url: img?.url ?? "",
      width: img?.width ?? 2688,
      height: img?.height ?? 1792,
      alt: img?.altText ?? p.title,
    },
    variants,
  };
}

export async function getArtworks(): Promise<Artwork[]> {
  const data = await storefront<{ products: { nodes: SfProduct[] } }>(
    PRODUCTS_QUERY,
    { variables: { first: 50 }, revalidate: REVALIDATE, tags: ["catalogue"] },
  );
  return data.products.nodes.map(toArtwork);
}

export async function getArtwork(handle: string): Promise<Artwork | null> {
  const data = await storefront<{ product: SfProduct | null }>(PRODUCT_QUERY, {
    variables: { handle },
    revalidate: REVALIDATE,
    tags: ["catalogue", `product:${handle}`],
  });
  return data.product ? toArtwork(data.product) : null;
}
