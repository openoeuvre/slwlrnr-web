"use client";

/**
 * The card library grid. Receives prose-free summaries only (see lib/learn.ts),
 * so nothing paid is ever in this component's props.
 *
 * Strand colour is treated as content, not chrome: it appears on the strand
 * label and a 2px rule above each card, and nowhere else in the interface.
 */

import Link from "next/link";
import { useMemo, useState } from "react";
import { Paywall } from "@/components/paywall";
import { Rule } from "@/components/ui";
import type { CardSummary } from "@/lib/learn";
import { titleCase } from "@/lib/text";
import { PRICING } from "@/lib/tiers";

export function CardLibrary({
  cards,
  entitled,
  counts,
}: {
  cards: CardSummary[];
  entitled: boolean;
  counts: { total: number; free: number; strands: number };
}) {
  const [strand, setStrand] = useState<string | null>(null);

  const strands = useMemo(() => {
    const seen = new Map<string, { name: string; colour: string; n: number }>();
    for (const c of cards) {
      const s = seen.get(c.strand);
      if (s) s.n++;
      else seen.set(c.strand, { name: c.strandName, colour: c.colour, n: 1 });
    }
    return [...seen.entries()];
  }, [cards]);

  // Free cards lead for non-subscribers — they are the shop window.
  const shown = useMemo(() => {
    const list = strand ? cards.filter((c) => c.strand === strand) : cards;
    if (entitled) return list;
    return [...list].sort(
      (a, b) => Number(a.access === "paid") - Number(b.access === "paid"),
    );
  }, [cards, strand, entitled]);

  const chip = (active: boolean) =>
    `label transition-colors ${active ? "text-ink" : "text-faint hover:text-muted"}`;

  return (
    <>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-y border-rule py-4">
        <button onClick={() => setStrand(null)} className={chip(!strand)}>
          All strands
        </button>
        {strands.map(([id, s]) => (
          <button
            key={id}
            onClick={() => setStrand(id)}
            className={`${chip(strand === id)} inline-flex items-center gap-2`}
          >
            <span
              className="inline-block h-1.5 w-1.5"
              style={{ background: s.colour }}
              aria-hidden
            />
            {s.name}
          </button>
        ))}
        <span className="label ml-auto text-faint tabular-nums">
          {entitled
            ? `${shown.length} cards`
            : `${shown.filter((c) => c.access === "free").length} of ${shown.length} open to you`}
        </span>
      </div>

      <ul className="grid grid-cols-1 gap-x-6 gap-y-12 pt-10 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((c) => {
          const open = entitled || c.access === "free";
          return (
            <li key={c.id}>
              <Link href={`/learn/${c.slug}`} className="group block">
                <div className="h-0.5 w-full" style={{ background: c.colour }} />
                <div className="relative mt-3 flex aspect-[4/3] items-center justify-center overflow-hidden bg-wash p-[5%]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={c.image}
                    alt={`${c.work}, ${c.artist}`}
                    loading="lazy"
                    className={`max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-[1.02] ${
                      open ? "" : "opacity-80"
                    }`}
                  />
                  <span
                    className={`label absolute left-3 top-3 px-2 py-1 ${
                      c.access === "free"
                        ? "bg-ink text-paper"
                        : open
                          ? "hidden"
                          : "border border-rule-strong bg-paper text-muted"
                    }`}
                  >
                    {c.access === "free" ? "Free" : "Learn"}
                  </span>
                </div>
                <div className="mt-4 flex items-baseline justify-between gap-3">
                  <span className="label" style={{ color: c.colour }}>
                    {c.strandName}
                  </span>
                  <span className="label text-faint tabular-nums">{c.number}</span>
                </div>
                <h2 className="mt-2 text-[0.9375rem] leading-snug">
                  {titleCase(c.title)}
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  {c.subtitle}
                </p>
                <p className="label mt-3 text-faint">
                  {c.artist} · {c.date}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>

      {!entitled && (
        <div className="pt-20">
          <Rule className="mb-20" />
          <Paywall
            plan="learn"
            headline="The whole deck, and every new card as it publishes."
            points={[
              `All ${counts.total} cards across ${counts.strands} strands, unlocked immediately`,
              "Every card's full essay, glossary and lineage",
              "Print-ready PDF of every card, front and back",
              "New cards added as each batch is finished",
              `$${PRICING.learn.amount}/month — cancel any time, downloaded PDFs stay yours`,
            ]}
          />
        </div>
      )}
    </>
  );
}
