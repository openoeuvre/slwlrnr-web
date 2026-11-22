"use client";

import { useMemo, useState } from "react";
import { Button, Note, SpecRow } from "@/components/ui";
import { ProductGallery } from "@/components/product-gallery";
import { useCart } from "@/lib/cart";
import { formatUSD } from "@/lib/commerce";
import {
  FORMATS,
  FORMAT_ORDER,
  mediaFor,
  sizeLabel,
  variantFor,
  type Artwork,
  type FormatId,
} from "@/data/artworks";

export function ArtworkPurchase({ artwork }: { artwork: Artwork }) {
  const { add, busy } = useCart();
  // Default to the first format that actually exists on this product.
  const [format, setFormat] = useState<FormatId>(
    FORMAT_ORDER.find((f) => variantFor(artwork, f)) ?? "ready",
  );

  const variant = variantFor(artwork, format);
  const media = useMemo(() => mediaFor(artwork), [artwork]);
  const soldOut = variant ? variant.available <= 0 : true;

  return (
    <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
      <div className="lg:col-span-7">
        <ProductGallery artwork={artwork} media={media} />
        <p className="label mt-4 text-faint">
          {sizeLabel(artwork)} · the room view is drawn to scale
        </p>
      </div>

      <div className="lg:col-span-5">
        <p className="label text-faint">{artwork.series} series</p>
        <h1 className="display mt-4 text-[2.25rem] sm:text-[2.75rem]">
          {artwork.title}
        </h1>
        <p className="mt-5 text-sm leading-[1.7] text-muted">
          {artwork.description}
        </p>

        {/* Format is the only option — each artwork is one size. */}
        <fieldset className="mt-10">
          <legend className="label text-faint">Format</legend>
          <div className="mt-3 grid gap-px bg-rule sm:grid-cols-2">
            {FORMAT_ORDER.map((f) => {
              const v = variantFor(artwork, f);
              if (!v) return null;
              const active = format === f;
              return (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  aria-pressed={active}
                  className={`px-4 py-4 text-left transition-colors ${
                    active ? "bg-ink text-paper" : "bg-paper hover:bg-wash"
                  }`}
                >
                  <span className="label block">{FORMATS[f].label}</span>
                  <span
                    className={`mt-1.5 block text-sm tabular-nums ${
                      active ? "text-paper/75" : "text-ink"
                    }`}
                  >
                    {formatUSD(v.price)}
                  </span>
                  <span
                    className={`label mt-1 block ${
                      active ? "text-paper/60" : "text-faint"
                    }`}
                  >
                    {v.available > 0 ? FORMATS[f].lead : "Sold out"}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted">
            {FORMATS[format].description}
          </p>
        </fieldset>

        <dl className="mt-10">
          <SpecRow label="Price">
            {variant ? formatUSD(variant.price) : "—"}
          </SpecRow>
          <SpecRow label="Size">{sizeLabel(artwork)}</SpecRow>
          {artwork.editionSize > 0 && (
            <SpecRow label="Edition">
              {artwork.editionSize} — shared across both formats
            </SpecRow>
          )}
          <SpecRow label="Series">{artwork.series}</SpecRow>
        </dl>

        {artwork.medium && (
          <p className="mt-5 text-xs leading-relaxed text-muted">
            {artwork.medium}
          </p>
        )}

        {variant ? (
          <>
            <Button
              className="mt-8 w-full"
              onClick={() => add(variant.id)}
              disabled={busy || soldOut}
            >
              {soldOut
                ? "Sold out"
                : busy
                  ? "Adding…"
                  : `Add to cart — ${formatUSD(variant.price)}`}
            </Button>
            <p className="mt-3 text-xs leading-relaxed text-faint">
              Made to order. Free shipping within the US.
            </p>
          </>
        ) : (
          <div className="mt-8">
            <Note>This format is not currently offered for this work.</Note>
          </div>
        )}
      </div>
    </div>
  );
}
