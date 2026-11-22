import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/container";
import { getEntitlements } from "@/lib/entitlements-server";
import {
  cardBySlug,
  neighbours,
  resolveCross,
  viewFor,
} from "@/lib/learn";
import { titleCase } from "@/lib/text";
import { CardDetail } from "./card-detail";

type Params = { params: Promise<{ slug: string }> };

// Gated per viewer — must render per request, never from a shared cache.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const card = cardBySlug(slug);
  if (!card) return { title: "Not found" };
  return {
    title: titleCase(card.title),
    // Subtitle and invitation are public on every card; safe for previews.
    description: `${card.subtitle}. ${card.credit.artist}, ${card.credit.work}.`,
    openGraph: { images: [{ url: card.image }] },
  };
}

export default async function CardPage({ params }: Params) {
  const { slug } = await params;
  const card = cardBySlug(slug);
  if (!card) notFound();

  const { learn } = await getEntitlements();
  const view = viewFor(card, learn);
  const { prev, next } = neighbours(slug);

  return (
    <Container>
      <nav className="py-6">
        <Link href="/learn" className="label text-faint hover:text-ink">
          ← Lesson cards
        </Link>
      </nav>

      <CardDetail card={view} cross={resolveCross(card.cross)} />

      <nav className="mt-16 grid gap-px border-t border-rule bg-rule sm:grid-cols-2">
        {prev ? (
          <Link
            href={`/learn/${prev.slug}`}
            className="bg-paper px-1 py-8 transition-colors hover:bg-wash"
          >
            <p className="label text-faint">← Previous</p>
            <p className="mt-2 text-sm">{titleCase(prev.title)}</p>
          </Link>
        ) : (
          <span className="bg-paper" />
        )}
        {next ? (
          <Link
            href={`/learn/${next.slug}`}
            className="bg-paper px-1 py-8 text-right transition-colors hover:bg-wash"
          >
            <p className="label text-faint">Next →</p>
            <p className="mt-2 text-sm">{titleCase(next.title)}</p>
          </Link>
        ) : (
          <span className="bg-paper" />
        )}
      </nav>
    </Container>
  );
}
