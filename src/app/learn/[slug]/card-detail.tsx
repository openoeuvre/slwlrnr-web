/**
 * A single lesson card. SERVER component.
 *
 * It receives a CardView already trimmed by viewFor(): for a non-subscriber on
 * a paid card, the essay holds only the opening paragraph and words, thread
 * and need are empty. Paid prose is therefore never in the HTML at all —
 * not hidden, absent.
 */

import Link from "next/link";
import { Paywall } from "@/components/paywall";
import { Rule, SpecRow } from "@/components/ui";
import type { CardView } from "@/lib/learn";
import { titleCase } from "@/lib/text";

type Cross = { label: string; card: { slug: string; title: string } | null };

const Html = ({ html, className }: { html: string; className?: string }) => (
  // Authored card copy containing only <i>/<b>; not user input.
  <span className={className} dangerouslySetInnerHTML={{ __html: html }} />
);

function Section({
  label,
  colour,
  children,
}: {
  label: string;
  colour?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-12">
      <h2 className="label" style={colour ? { color: colour } : undefined}>
        {label}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function CardDetail({ card, cross }: { card: CardView; cross: Cross }) {
  const { credit, colour, locked } = card;

  return (
    <div className="grid gap-12 py-8 lg:grid-cols-12 lg:gap-16 lg:py-12">
      {/* ---------------------------------------------------------- */}
      {/* Front: the artwork, never cropped                           */}
      {/* ---------------------------------------------------------- */}
      <div className="lg:col-span-6">
        <div className="lg:sticky lg:top-28">
          <div className="h-0.5 w-full" style={{ background: colour }} />
          <div className="mt-3 flex aspect-[4/5] items-center justify-center bg-wash p-[6%]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={card.image}
              alt={`${credit.work}, ${credit.artist}, ${credit.date}`}
              className="max-h-full max-w-full object-contain"
            />
          </div>

          <dl className="mt-6">
            <SpecRow label="Artist">{credit.artist}</SpecRow>
            <SpecRow label="Work">
              <i>{credit.work}</i>
            </SpecRow>
            <SpecRow label="Date">{credit.date}</SpecRow>
            {credit.medium && <SpecRow label="Medium">{credit.medium}</SpecRow>}
            <SpecRow label="Collection">{credit.collection}</SpecRow>
            <SpecRow label="Rights">{credit.rights}</SpecRow>
          </dl>
          {credit.objectUrl && (
            <a
              href={credit.objectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="label link-underline mt-4 inline-block text-ink"
            >
              See it in the collection ↗
            </a>
          )}
        </div>
      </div>

      {/* ---------------------------------------------------------- */}
      {/* Back: the lesson                                            */}
      {/* ---------------------------------------------------------- */}
      <article className="lg:col-span-6">
        <div className="flex items-baseline justify-between gap-4">
          <p className="label" style={{ color: colour }}>
            {card.strandName}
          </p>
          <p className="label text-faint tabular-nums">{card.number}</p>
        </div>
        <h1 className="display mt-4 text-[2.5rem] sm:text-[3.25rem]">
          {titleCase(card.title)}
        </h1>
        <p className="mt-3 text-lg leading-snug text-muted">{card.subtitle}</p>

        {/* The invitation is public on every card — it is the hook. */}
        <Section label="The invitation">
          <p
            className="border-l-2 pl-5 text-[1.0625rem] leading-[1.6]"
            style={{ borderColor: colour }}
          >
            <Html html={card.invitation} />
          </p>
        </Section>

        <Section label="What's going on here">
          <div className="measure space-y-4 text-[0.9375rem] leading-[1.7] text-ink">
            {card.essay.map((p, i) => (
              <p key={i}>
                <Html html={p} />
              </p>
            ))}
          </div>
          {locked && (
            <div className="relative mt-2">
              <div className="h-16 bg-gradient-to-b from-paper/0 to-paper" />
              <div className="mt-2">
                <Paywall
                  plan="learn"
                  compact
                  headline="The rest of this card — the full essay, glossary, lineage and a print-ready PDF — comes with Learn."
                  points={[]}
                />
              </div>
            </div>
          )}
        </Section>

        {!locked && card.words.length > 0 && (
          <Section label="Words to know">
            <dl>
              {card.words.map((w) => (
                <div key={w.term} className="border-t border-rule py-4">
                  <dt className="text-sm">{w.term}</dt>
                  <dd className="mt-1 text-sm leading-relaxed text-muted">
                    <Html html={w.definition} />
                  </dd>
                </div>
              ))}
            </dl>
          </Section>
        )}

        {!locked && card.thread.length > 0 && (
          <Section label="Follow the thread">
            <ol className="flex flex-wrap gap-x-2 gap-y-1 text-sm leading-relaxed text-muted">
              {card.thread.map((t, i) => (
                <li key={t}>
                  {t}
                  {i < card.thread.length - 1 && (
                    <span className="pl-2 text-faint" aria-hidden>
                      →
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </Section>
        )}

        {!locked && card.need && (
          <Section label="What you need">
            <p className="measure text-sm leading-relaxed text-muted">
              <Html html={card.need} />
            </p>
          </Section>
        )}

        {cross.label && (
          <Section label="Pairs with">
            {cross.card ? (
              <Link
                href={`/learn/${cross.card.slug}`}
                className="link-underline text-sm"
              >
                {titleCase(cross.card.title)}
              </Link>
            ) : (
              <p className="text-sm text-muted">
                {cross.label}{" "}
                <span className="label text-faint">· coming soon</span>
              </p>
            )}
          </Section>
        )}

        <Rule className="mt-12" />
        <div className="mt-8">
          {locked ? (
            <p className="text-xs leading-relaxed text-faint">
              Print-ready PDF of this card, front and back, included with Learn.
            </p>
          ) : (
            // Plain <a>, not next/link: a PDF is a file, not a route, and
            // client-side navigation would try to fetch it as a page.
            <a
              href={card.pdf}
              download
              className="label inline-flex h-11 items-center justify-center border border-rule-strong px-5 text-ink transition-colors hover:border-ink"
            >
              Download print PDF
            </a>
          )}
        </div>
      </article>
    </div>
  );
}
