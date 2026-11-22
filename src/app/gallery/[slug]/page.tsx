import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/container";
import { ArtworkImage } from "@/components/artwork-image";
import { Rule } from "@/components/ui";
import { getArtwork, getArtworks } from "@/lib/catalogue";
import { sizeLabel } from "@/data/artworks";
import { ArtworkPurchase } from "./artwork-purchase";

type Params = { params: Promise<{ slug: string }> };

/**
 * Pre-render the catalogue at build time; `getArtwork` still revalidates every
 * five minutes, so price and stock changes appear without a redeploy.
 */
export async function generateStaticParams() {
  try {
    return (await getArtworks()).map((a) => ({ slug: a.slug }));
  } catch {
    // Shopify unreachable at build time — fall back to on-demand rendering.
    return [];
  }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const artwork = await getArtwork(slug).catch(() => null);
  if (!artwork) return { title: "Not found" };
  return {
    title: artwork.title,
    description: artwork.description,
    openGraph: {
      title: artwork.title,
      description: artwork.description,
      images: artwork.image.url
        ? [{ url: artwork.image.url, alt: artwork.image.alt }]
        : [],
    },
  };
}

export default async function ArtworkPage({ params }: Params) {
  const { slug } = await params;
  const artwork = await getArtwork(slug);
  if (!artwork) notFound();

  // Capped at three — Nova alone has twelve, and a wall of thumbnails at the
  // bottom of a product page competes with the work above it.
  const related = (await getArtworks().catch(() => []))
    .filter((a) => a.series === artwork.series && a.id !== artwork.id)
    .slice(0, 3);

  return (
    <Container>
      <nav className="py-6">
        <Link href="/gallery" className="label text-faint hover:text-ink">
          ← Gallery
        </Link>
      </nav>

      <ArtworkPurchase artwork={artwork} />

      {related.length > 0 && (
        <section className="pt-24 sm:pt-32">
          <Rule className="mb-8" />
          <p className="label text-faint">More from {artwork.series}</p>
          <ul className="mt-8 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-3">
            {related.map((a) => (
              <li key={a.id}>
                <Link href={`/gallery/${a.slug}`} className="group block">
                  <div className="overflow-hidden bg-wash">
                    <ArtworkImage
                      image={a.image}
                      sizes="(min-width: 640px) 33vw, 100vw"
                      className="h-auto w-full transition-transform duration-500 group-hover:scale-[1.015]"
                    />
                  </div>
                  <p className="mt-4 text-sm">{a.title}</p>
                  <p className="label mt-1 text-faint">{sizeLabel(a)}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </Container>
  );
}
