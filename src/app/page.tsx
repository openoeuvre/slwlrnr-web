import Link from "next/link";
import { Container } from "@/components/container";
import { ArtworkImage } from "@/components/artwork-image";
import { ButtonLink, Rule } from "@/components/ui";
import { priceFrom, sizeLabel } from "@/data/artworks";
import { getArtworks } from "@/lib/catalogue";
import { getSystems } from "@/lib/create/inference";
import { formatUSD } from "@/lib/commerce";
import { PRICING } from "@/lib/tiers";

const STRANDS = [
  {
    href: "/gallery",
    label: "Gallery",
    title: "Original works, three sizes",
    body: "Archival prints and ready-to-hang editions. Every work is a computational collage produced by one of our natural-systems transformations.",
    meta: '48" × 32" · 32" × 48" · 36" × 36"',
  },
  {
    href: "/learn",
    label: "Learn",
    title: "Lesson cards",
    body: "Art history you do rather than read about. Each card pairs a real artwork from the world's open museum collections with one idea and one thing to make — from Leonardo's stained wall to Hokusai's wave.",
    meta: `Five cards free · $${PRICING.learn.amount}/month for the library`,
  },
  {
    href: "/create",
    label: "Create",
    title: "Computational collage",
    body: "Bring two or three of your own images. Choose a natural system. The transformation negotiates between your sources rather than averaging them.",
    meta: `Signature free · Studio $${PRICING.create.amount}/month for every system`,
  },
];

export default async function HomePage() {
  // The home page should never 500 because Shopify is briefly unreachable.
  const [artworks, catalogue] = await Promise.all([
    getArtworks().catch(() => []),
    getSystems(),
  ]);
  const featured = artworks.slice(0, 3);
  const systems = catalogue?.systems ?? [];

  return (
    <Container>
      {/* Statement */}
      <section className="grid gap-10 pt-16 pb-16 sm:pt-28 sm:pb-24 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-8">
          <p className="label text-faint">SLWLRNR — Computational collage</p>
          <h1 className="display mt-7 text-[2.75rem] sm:text-[4.25rem] lg:text-[5.25rem]">
            Patterns that nature<br className="hidden sm:block" /> already solved.
          </h1>
        </div>
        <div className="lg:col-span-4 lg:pt-24">
          <p className="measure text-[0.9375rem] leading-[1.7] text-muted">
            We build images by running photographs through the same processes
            that pattern a shell, a river network, or a cooling mineral. Then we
            teach the processes, and hand the tool over.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <ButtonLink href="/gallery">View the gallery</ButtonLink>
            <ButtonLink href="/create" variant="outline">
              Try the tool
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* Featured works */}
      <section className="grid gap-px bg-rule sm:grid-cols-3">
        {featured.map((a, i) => (
          <Link key={a.id} href={`/gallery/${a.slug}`} className="group bg-paper">
            <div className="aspect-[3/2] overflow-hidden bg-wash">
              <ArtworkImage
                image={a.image}
                priority={i === 0}
                sizes="(min-width: 640px) 33vw, 100vw"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              />
            </div>
            <div className="px-1 py-4">
              <p className="text-sm">{a.title}</p>
              <p className="label mt-1 text-faint">
                {sizeLabel(a)} · from {formatUSD(priceFrom(a))}
              </p>
            </div>
          </Link>
        ))}
      </section>

      {/* Three strands */}
      <section className="pt-24 sm:pt-32">
        <p className="label text-faint">Three parts, one studio</p>
        <div className="mt-8 grid gap-px bg-rule lg:grid-cols-3">
          {STRANDS.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="group flex flex-col bg-paper p-7 transition-colors hover:bg-wash sm:p-9"
            >
              <p className="label text-faint">{s.label}</p>
              <h2 className="display mt-5 text-2xl sm:text-[1.75rem]">
                {s.title}
              </h2>
              <p className="mt-4 flex-1 text-sm leading-relaxed text-muted">
                {s.body}
              </p>
              <p className="label mt-8 text-ink">{s.meta}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Systems index — read live from the engine, the only place the
          natural systems are defined. Hidden if the engine is unreachable. */}
      {systems.length > 0 && (
        <section className="pt-24 sm:pt-32">
          <div className="flex items-baseline justify-between gap-6">
            <p className="label text-faint">The natural systems</p>
            <Link href="/create" className="label link-underline text-muted">
              Use these
            </Link>
          </div>
          <Rule className="mt-4" />
          <ul>
            {systems.map((s) => (
              <li
                key={s.key}
                className="grid gap-1 border-b border-rule py-4 sm:grid-cols-12 sm:gap-6 sm:py-5"
              >
                <span className="sm:col-span-4">{s.name}</span>
                <span className="text-sm text-muted sm:col-span-7">
                  {s.description}
                </span>
                <span className="label text-faint sm:col-span-1 sm:text-right">
                  {s.premium ? "Studio" : "Free"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </Container>
  );
}
