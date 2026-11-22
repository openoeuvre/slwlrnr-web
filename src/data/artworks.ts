/**
 * Artwork types and presentation constants.
 *
 * The catalogue itself now comes from Shopify — see `src/lib/catalogue.ts`.
 * What lives here is the shape everything downstream consumes, plus the copy
 * that is ours rather than the store's (format descriptions, lead times).
 */

/* ------------------------------------------------------------------ */
/* Formats                                                             */
/* ------------------------------------------------------------------ */

export type FormatId = "ready" | "rolled";

/**
 * Presentation copy for each variant. Deliberately not in Shopify: it is the
 * same for every product and reads better maintained alongside the design.
 * The mapping from Shopify's Format option values lives in `catalogue.ts`.
 */
export const FORMATS: Record<
  FormatId,
  { id: FormatId; label: string; description: string; lead: string }
> = {
  ready: {
    id: "ready",
    label: "Ready to hang",
    description:
      'Face-mounted to 1/8" glossy acrylic on an aluminium sub-frame, with polished sides and hanging hardware fitted. Arrives ready for the wall.',
    lead: "Ships in 10–14 business days",
  },
  rolled: {
    id: "rolled",
    label: "Print, rolled",
    description:
      "Archival photo metallic print, unmounted, shipped rolled in a rigid tube. Framing or mounting is yours to arrange.",
    lead: "Ships in 5–7 business days",
  },
};

/** Display order on the product page. */
export const FORMAT_ORDER: FormatId[] = ["ready", "rolled"];

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type Orientation = "landscape" | "portrait" | "square";

export type ArtworkImage = {
  url: string;
  width: number;
  height: number;
  alt: string;
};

export type Variant = {
  format: FormatId;
  /** Shopify ProductVariant GID — what cartLinesAdd needs. */
  id: string;
  price: number;
  /** Remaining inventory at this variant. */
  available: number;
};

export type Artwork = {
  /** Shopify Product GID. */
  id: string;
  /** Shopify handle. Used as the route segment. */
  slug: string;
  title: string;
  series: string;
  description: string;
  widthIn: number;
  heightIn: number;
  /** Shared across formats — 50 of the image, not 50 of each. */
  editionSize: number;
  medium: string;
  image: ArtworkImage;
  variants: Variant[];
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

export function orientationOf(a: Artwork): Orientation {
  if (a.widthIn > a.heightIn) return "landscape";
  if (a.widthIn < a.heightIn) return "portrait";
  return "square";
}

/** e.g. `48" × 32"` */
export function sizeLabel(a: Artwork): string {
  if (!a.widthIn || !a.heightIn) return "Dimensions not set";
  const n = (v: number) => (Number.isInteger(v) ? v : v.toFixed(1));
  return `${n(a.widthIn)}" × ${n(a.heightIn)}"`;
}

export function variantFor(a: Artwork, format: FormatId): Variant | undefined {
  return a.variants.find((x) => x.format === format);
}

export function priceFrom(a: Artwork): number {
  if (a.variants.length === 0) return 0;
  return Math.min(...a.variants.map((v) => v.price));
}

/* ------------------------------------------------------------------ */
/* Media                                                               */
/* ------------------------------------------------------------------ */

/**
 * Three views, one file. Only `work` is a real image in Shopify — `room` is
 * composited at runtime over the calibrated room photograph, and `detail` is
 * the same file under a zoom-and-pan viewport.
 */
export type MediaKind = "work" | "room" | "detail";

export type ArtworkMedia = {
  id: string;
  kind: MediaKind;
  altText: string;
};

export function mediaFor(artwork: Artwork): ArtworkMedia[] {
  return [
    { id: `${artwork.slug}--work`, kind: "work", altText: artwork.image.alt },
    {
      id: `${artwork.slug}--room`,
      kind: "room",
      altText: `${artwork.title} hung in a room, shown at ${sizeLabel(artwork)} for scale`,
    },
    {
      id: `${artwork.slug}--detail`,
      kind: "detail",
      altText: `${artwork.title}, surface detail — drag to explore`,
    },
  ];
}
