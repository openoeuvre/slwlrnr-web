# Learning cards — handoff to the website

Twenty-four finished cards, built in the `slwlrnr-cards` project and exported
here. Content, print PDFs and web imagery are all generated — regenerate with:

```bash
cd ../slwlrnr-cards
python3 export_to_web.py --web ../slwlrnr-web
```

---

## What landed

| Path | What it is |
|---|---|
| `src/data/learn-cards.ts` | Typed content module. **Generated — do not edit by hand.** |
| `src/data/learn-cards.json` | Same data, for any non-TypeScript consumer. |
| `public/learn/pdf/<slug>.pdf` | One 2-page PDF per card (front + back), ~1.3 MB each, 300 dpi. |
| `public/learn/img/<slug>.jpg` | Artwork for the card page, max 1600 px. |

**24 cards, not 25.** `SYS-11 Salt on a Drum` is written but has no usable
artwork yet — every Wikimedia copy of Chladni's 1787 plates that the resolver
can reach is either the book's title page or a whole-book scan. The copy is
finished and waiting; it needs one hand-picked file, then a re-export.

---

## The free/paid split

**Five free cards:** The Stained Wall · The Wave · The Photogram · Ultramarine ·
Geometric Tiling. Chosen as the shop window — the four strongest images plus the
strongest concept.

The important difference from the existing `src/data/cards.ts`:

> `cards.ts` derives the free set from **array position** (`LIMITS.freeCards`).
> `learn-cards.ts` uses an explicit **`access: "free" | "paid"`** field.

Positional works while the free cards are the first five and nothing is ever
reordered. It breaks the moment you want to promote card 19 to free for a
campaign, or reorder by strand. Explicit is safer here; reconcile the two models
before both ship.

### Gating

`publicView(card, entitled)` is exported for this. Call it **on the server**:

```ts
import { cardBySlug, publicView } from "@/data/learn-cards";

const card = cardBySlug(params.slug);
const visible = publicView(card, entitlements.learn);
```

It strips `essay`, `words`, `thread` and `need` for a non-entitled viewer while
leaving title, subtitle, artwork, credit and **invitation** intact. The
invitation is deliberately public — it is the hook, and it is what makes the
card worth subscribing for.

Two things that are not optional:

1. **Never send paid prose to an anonymous client and hide it with CSS.** The
   static reference build at `slwlrnr-cards/web/` omits it from the HTML
   entirely; the Next.js version should do the same.
2. **Gate the PDF route too.** Files in `public/` are served unauthenticated by
   Next.js. `/learn/pdf/ultramarine.pdf` is fine — it is free — but the other
   nineteen are guessable from the slug. They need to move behind an API route
   that checks entitlement and streams the file, or into private storage with
   signed URLs. Leaving them in `public/` ships the paywall wide open.

---

## Content shape

```ts
type LearnCard = {
  id; slug; number;                    // "SEE-03", "the-stained-wall", "03"
  strand; strandName; colour;          // "seeing", "WAYS OF SEEING", "#2E3A7A"
  title; subtitle;
  access;                              // "free" | "paid"
  invitation;                          // the activity — public
  essay: string[];                     // PAID. 5 paragraphs, may contain <i>/<b>
  words: { term; definition }[];       // PAID. 3 glossary terms
  thread: string[];                    // PAID. 6 related names
  need;                                // PAID. materials line
  cross;                               // "Pairs with ..." cross-reference
  credit: { artist; work; date; medium; collection; rights; objectUrl };
  image; pdf;                          // /public paths
};
```

`essay` paragraphs may contain `<i>` and `<b>`. They are authored, not
user-supplied, so rendering them as HTML is safe — but if you pipe them through
anything that also accepts user input, sanitise there.

`colour` is the strand accent, already used on the printed card. Worth reusing
on the web so print and screen agree.

---

## Rights

Every card's artwork is **CC0 or public domain, cleared worldwide**, sourced
from the Met, the Art Institute of Chicago, Cleveland, or Wikimedia Commons
under a verified public-domain template. `credit.rights` carries the basis and
is printed on both the card and the page — keep it visible.

The full clearance ledger, including object IDs and the reasoning for each
territory determination, lives in `slwlrnr-cards/resolved_launch25.csv`.

One thing worth not undoing: the resolver rejects **CC BY-SA** scans. Share-alike
can propagate obligations into a paid product. If anyone adds artwork by hand,
the same rule applies — public domain or CC0 only.

---

## Eight strands

`MAKING MARKS` · `MATERIALS & SURFACES` · `WAYS OF SEEING` ·
`SYSTEMS & CHANCE` · `OBJECTS TRANSFORMED` · `THE NATURAL WORLD` ·
`IDENTITY & REPRESENTATION` · `MOVEMENTS & MOMENTS`

Three cards each, four in The Natural World. There are 88 curated subjects in
the pipeline (`slwlrnr-cards/anchors.csv`), each with a named anchor artwork, so
the next batches are ready to source and write.

---

## Reference rendering

`slwlrnr-cards/web/index.html` is a static build of all of this — index grid
plus a page per card, with the paywall applied. It is not production code, but
the markup and CSS are a working reference for the component layer, and it
demonstrates the intended gating behaviour.
