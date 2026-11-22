# SLWLRNR — design language

A specification for reproducing this interface. Written for another agent or
designer picking up the work cold.

---

## The one-paragraph version

Cool minimal, architectural. True white ground, near-black ink, a single
grotesque at two weights only. Structure is carried by hairline rules and a
tight grid, never by boxes, shadows, or fills. The interface is entirely
achromatic — **the only colour on any page comes from the artwork itself**.
It should read like an architecture monograph or an exhibition catalogue:
generous, quiet, confident, and slightly severe. The discipline is in what it
refuses to add.

---

## The five rules that actually matter

If everything else is forgotten, keep these. They generate most of the look.

1. **No colour in the interface, ever.** Greys and near-black only. Colour is a
   property of content. A coloured button or badge breaks the entire premise.
2. **Never bold.** Two weights: 400 for everything, 500 for uppercase
   micro-labels. Large text gets *tighter* tracking, not heavier weight.
3. **One-pixel rules instead of containers.** No cards, no rounded corners, no
   drop shadows, no elevation. Separation is a hairline or it is whitespace.
4. **Zero border radius.** Every corner is square — buttons, inputs, images,
   thumbnails, panels. This is the fastest tell of the style.
5. **Uppercase micro-labels.** 11px, letter-spacing 0.09em, weight 500, for
   every eyebrow, field label, meta line, and button. This is the single most
   recognisable element in the system.

---

## Tokens

```css
--color-paper:       #ffffff;  /* page ground — true white, not off-white */
--color-wash:        #f5f5f6;  /* image wells, inactive panels */
--color-rule:        #e2e2e4;  /* default hairline */
--color-rule-strong: #c9c9cd;  /* emphasised hairline, outline buttons */
--color-faint:       #a1a1a8;  /* labels, metadata, de-emphasised */
--color-muted:       #6a6a72;  /* body copy */
--color-ink:         #101012;  /* headings, primary — near-black, not #000 */
--color-signal:      #2f2f34;  /* hover state on solid buttons. Only accent. */
```

Seven greys and one hover state. That is the entire palette. Resist adding to
it — semantic colour (error red, success green) is deliberately absent; state
is communicated with rules, position, and copy instead.

`color-scheme: light` is set explicitly. There is no dark mode; on a white-ground
gallery site it would fight the work.

## Type

One typeface. **Inter** as the working choice, but any neutral grotesque works —
Helvetica Neue, Söhne, Suisse, Neue Haas. Never a serif, never a display face.

| Role | Spec |
| --- | --- |
| Display / headings | weight 400, `letter-spacing: -0.022em`, `line-height: 1.04` |
| Body | weight 400, ~15px (`0.9375rem`), `line-height: 1.65` |
| Micro-label | 11px, uppercase, `letter-spacing: 0.09em`, weight 500 |
| Numerals | `tabular-nums` on every price, dimension, count, and quantity |

Heading sizes run large and jump hard: `2.5rem` → `3.5rem` → `4rem` across
breakpoints, up to `5.25rem` on the home statement. The scale is dramatic
*because* nothing else is.

Body copy is capped at `62ch`. Never let a paragraph run the full grid.

## Layout

- Container: `max-w-[1280px]`, or `1600px` for tool-like pages. Gutters
  `20px / 32px / 48px` at mobile / sm / lg.
- 12-column grid on large screens. The recurring split is **7/5** — content
  left, supporting detail right — not 50/50, which reads static.
- Vertical rhythm is large: `pt-14 pb-12` on mobile, `pt-20 pb-16` up. Sections
  separate by `pt-24` to `pt-32`. When in doubt, add space rather than a rule.
- **Grid lines via `gap-px` on a `bg-rule` parent.** Children get `bg-paper`,
  and the 1px gaps become the grid. This produces the hairline mesh that
  characterises the layout, with no borders on any child.

## Components

Every page opens with the same block: **uppercase eyebrow → oversized heading →
supporting paragraph in the right column.** Consistency here does much of the
work.

- **Button** — 44px tall, square, `label` type, `px-5`. Three variants: solid
  (ink fill, paper text), outline (rule-strong border, transparent), quiet
  (text only). No radius, no shadow, no gradient.
- **SpecRow** — `border-top` hairline, label left in faint uppercase, value
  right in tabular numerals. Used for every specification, price, and metadata
  list. Stack them into a `<dl>`; the repeated hairlines become the structure.
- **Tag** — 24px tall, 1px rule, uppercase micro-label. Never filled.
- **Note** — a `border-left` hairline with `pl-4`. Used for empty states,
  caveats, and locked messaging. Replaces the alert box entirely.
- **Rule** — a plain 1px `border-top`. Used liberally.

## Motion

Almost none, and always functional.

- Transitions are 150ms for colour, 500ms for image scale.
- Hover on an image: `scale-[1.015]` — barely perceptible, and that is correct.
- Controls fade in on group hover rather than sitting permanently on the page.
- `prefers-reduced-motion` collapses everything to 0.01ms.

No entrance animations, no parallax, no scroll-triggered reveals.

## Imagery

- Images sit in a `bg-wash` well so they never float on raw white.
- Product images are letterboxed (`object-contain`) with ~6% padding, so the
  full composition is always visible. Grid thumbnails may crop.
- Square viewports for anything switchable, so the layout never jumps between
  views.
- No filters, no overlays, no gradient scrims, no text over images.

## Voice

The writing is part of the design and should match its restraint.

- Plain and declarative. Short sentences. No marketing register, no
  exclamation marks, no emoji.
- Specific over evocative: "Ships in 10–14 business days" not "Fast shipping!"
- Sentence case in prose; uppercase reserved for micro-labels.
- Say what a thing *is*, then stop.

---

## Failure modes

The style degrades in predictable ways. Watch for:

- **Adding a colour** for emphasis. Use position, weight, or whitespace instead.
- **Reaching for bold.** Increase size or tighten tracking.
- **Boxing things in.** If a group needs separation, try whitespace, then a
  single hairline, and stop there.
- **Rounding a corner.** Once one is rounded the system reads as generic SaaS.
- **Filling a badge or tag.** Outlined only.
- **Crowding.** This design needs air. Cramped, it looks unfinished rather
  than minimal.

---

## Prompt for another agent

> Build this in the SLWLRNR design language: cool minimal, architectural.
> True white ground (#ffffff), near-black ink (#101012), a scale of seven greys,
> and **no colour anywhere in the interface** — colour comes only from content
> imagery. One neutral grotesque at two weights: 400 for everything, 500 for
> 11px uppercase micro-labels with 0.09em tracking, which are used for every
> eyebrow, field label, and button. Never bold. Zero border radius on anything.
> No cards, shadows, or elevation — structure comes from 1px hairline rules and
> generous whitespace. 12-column grid, 7/5 splits, body text capped at 62ch,
> tabular numerals on all figures. Headings run large (2.5–5rem) with tightened
> tracking. Motion is minimal and functional only. It should read like an
> architecture monograph, not a web app.
