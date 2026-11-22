"use client";

/**
 * ProductGallery — the media carousel on the product detail page.
 *
 * Three views from one file: the work, the room composite, and a zoomable
 * detail. Only the first is stored in Shopify.
 */

import { useCallback, useState } from "react";
import { ArtworkImage } from "./artwork-image";
import { RoomPlate } from "./room-plate";
import { ZoomPan } from "./zoom-pan";
import type { Artwork, ArtworkMedia } from "@/data/artworks";

const KIND_LABEL: Record<ArtworkMedia["kind"], string> = {
  work: "The work",
  room: "In situ",
  detail: "Detail",
};

function MediaView({
  media,
  artwork,
  interactive = true,
  sizes,
}: {
  media: ArtworkMedia;
  artwork: Artwork;
  /** Thumbnails render a static preview — no drag handlers. */
  interactive?: boolean;
  sizes: string;
}) {
  if (media.kind === "room") {
    return <RoomPlate artwork={artwork} className="h-full w-full" sizes={sizes} />;
  }

  if (media.kind === "detail") {
    const img = (
      <ArtworkImage
        image={artwork.image}
        alt={media.altText}
        sizes={sizes}
        className="h-full w-full object-cover"
      />
    );
    if (!interactive) {
      return (
        <div className="h-full w-full overflow-hidden bg-wash">
          <div className="h-full w-full origin-center scale-[2.6]">{img}</div>
        </div>
      );
    }
    return <ZoomPan className="h-full w-full">{img}</ZoomPan>;
  }

  // The work, letterboxed so the full composition is always visible.
  return (
    <div className="flex h-full w-full items-center justify-center bg-wash p-[6%]">
      <ArtworkImage
        image={artwork.image}
        sizes={sizes}
        priority={interactive}
        className="h-auto max-h-full w-auto max-w-full object-contain"
      />
    </div>
  );
}

export function ProductGallery({
  artwork,
  media,
}: {
  artwork: Artwork;
  media: ArtworkMedia[];
}) {
  const [index, setIndex] = useState(0);

  const go = useCallback(
    (delta: number) => setIndex((i) => (i + delta + media.length) % media.length),
    [media.length],
  );

  const current = media[index];

  return (
    <div>
      <div
        tabIndex={0}
        role="group"
        aria-roledescription="carousel"
        aria-label={`${artwork.title}, image ${index + 1} of ${media.length}`}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") {
            e.preventDefault();
            go(1);
          }
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            go(-1);
          }
        }}
        className="group relative aspect-square overflow-hidden border border-rule bg-wash"
      >
        <MediaView
          media={current}
          artwork={artwork}
          sizes="(min-width: 1024px) 58vw, 100vw"
        />

        {/*
          Arrows stay available on every view, including the zoomable detail.
          The full-height column is pointer-events-none so it does not eat the
          drag gesture; only the 36px control itself is clickable.
        */}
        {media.length > 1 && (
          <>
            <button
              onClick={() => go(-1)}
              aria-label="Previous image"
              className="pointer-events-none absolute left-0 top-0 z-20 flex h-full w-16 items-center justify-center opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
            >
              <span className="label pointer-events-auto flex h-9 w-9 cursor-pointer items-center justify-center border border-ink bg-paper text-ink">
                ←
              </span>
            </button>
            <button
              onClick={() => go(1)}
              aria-label="Next image"
              className="pointer-events-none absolute right-0 top-0 z-20 flex h-full w-16 items-center justify-center opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
            >
              <span className="label pointer-events-auto flex h-9 w-9 cursor-pointer items-center justify-center border border-ink bg-paper text-ink">
                →
              </span>
            </button>
          </>
        )}

        <p className="label pointer-events-none absolute right-3 top-3 z-20 bg-paper px-2 py-1 text-faint tabular-nums">
          {String(index + 1).padStart(2, "0")} /{" "}
          {String(media.length).padStart(2, "0")}
        </p>
      </div>

      <ul className="mt-3 grid grid-cols-3 gap-3">
        {media.map((m, i) => (
          <li key={m.id}>
            <button
              onClick={() => setIndex(i)}
              aria-label={m.altText}
              aria-current={i === index}
              className="block w-full text-left"
            >
              <span
                className={`block aspect-square w-full overflow-hidden border transition-colors ${
                  i === index
                    ? "border-ink"
                    : "border-rule hover:border-rule-strong"
                }`}
              >
                <MediaView
                  media={m}
                  artwork={artwork}
                  interactive={false}
                  sizes="(min-width: 1024px) 20vw, 33vw"
                />
              </span>
              <span
                className={`label mt-2 block ${
                  i === index ? "text-ink" : "text-faint"
                }`}
              >
                {KIND_LABEL[m.kind]}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
