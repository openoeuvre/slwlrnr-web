"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArtworkImage } from "@/components/artwork-image";
import { Note } from "@/components/ui";
import { formatUSD } from "@/lib/commerce";
import {
  orientationOf,
  priceFrom,
  sizeLabel,
  type Artwork,
  type Orientation,
} from "@/data/artworks";

const ORIENTATIONS: { id: Orientation; label: string }[] = [
  { id: "landscape", label: '48 × 32' },
  { id: "portrait", label: '32 × 48' },
  { id: "square", label: '36 × 36' },
];

export function GalleryGrid({ artworks }: { artworks: Artwork[] }) {
  const [series, setSeries] = useState<string | null>(null);
  const [orientation, setOrientation] = useState<Orientation | null>(null);

  const allSeries = useMemo(
    () => [...new Set(artworks.map((a) => a.series))].sort(),
    [artworks],
  );

  const shown = useMemo(
    () =>
      artworks.filter(
        (a) =>
          (!series || a.series === series) &&
          (!orientation || orientationOf(a) === orientation),
      ),
    [artworks, series, orientation],
  );

  if (artworks.length === 0) {
    return (
      <div className="py-10">
        <Note>
          No published products found. Check the works are published to the
          Headless sales channel in Shopify — products published only to the
          Online Store are invisible to the Storefront API.
        </Note>
      </div>
    );
  }

  const chip = (active: boolean) =>
    `label transition-colors ${active ? "text-ink" : "text-faint hover:text-muted"}`;

  return (
    <>
      {/* Series */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-rule py-4">
        <button onClick={() => setSeries(null)} className={chip(!series)}>
          All series
        </button>
        {allSeries.map((s) => (
          <button
            key={s}
            onClick={() => setSeries(s)}
            className={chip(series === s)}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Size */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-y border-rule py-4">
        <button
          onClick={() => setOrientation(null)}
          className={chip(!orientation)}
        >
          All sizes
        </button>
        {ORIENTATIONS.map((o) => (
          <button
            key={o.id}
            onClick={() => setOrientation(o.id)}
            className={chip(orientation === o.id)}
          >
            {o.label}
          </button>
        ))}
        <span className="label ml-auto text-faint tabular-nums">
          {shown.length} {shown.length === 1 ? "work" : "works"}
        </span>
      </div>

      {shown.length === 0 ? (
        <div className="py-16">
          <Note>Nothing matches that combination.</Note>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-x-6 gap-y-12 pt-10 sm:grid-cols-2 sm:gap-y-16 lg:grid-cols-3">
          {shown.map((a, i) => (
            <li key={a.id}>
              <Link href={`/gallery/${a.slug}`} className="group block">
                <div className="overflow-hidden bg-wash">
                  <ArtworkImage
                    image={a.image}
                    priority={i < 3}
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="h-auto w-full transition-transform duration-500 group-hover:scale-[1.015]"
                  />
                </div>
                <div className="mt-4 flex items-baseline justify-between gap-4">
                  <h2 className="text-[0.9375rem]">{a.title}</h2>
                  <span className="label text-faint tabular-nums">
                    from {formatUSD(priceFrom(a))}
                  </span>
                </div>
                <p className="label mt-1.5 text-faint">
                  {sizeLabel(a)}
                  {a.editionSize > 0 ? ` · edition of ${a.editionSize}` : ""}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
