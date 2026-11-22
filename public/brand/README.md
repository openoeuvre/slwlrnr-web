# Brand assets

`logo.png` — the brand mark. Referenced as `/brand/logo.png` in two places:

- `src/components/site-header.tsx` — links home, sticky on every page
- `src/components/site-footer.tsx` — sign-off in the bottom bar, not a link

## Notes

- The header renders it at **32px tall** on mobile, **40px** on desktop, width
  auto. For retina, supply at least 3× that — 120px tall minimum, more is fine.
- To resize: the `h-8 sm:h-10` class on the `<img>` in
  `src/components/site-header.tsx`. Raise the bar height (`h-16 sm:h-20`) on the
  row above it by the same step to keep the clearance even.
- Transparent background is correct. It sits on white (`--color-paper`).
- The mark should be dark. The header background is true white; a light or
  white logo will disappear.
- **SVG is better than PNG here** if you have vector source. Crisp at every
  size, usually smaller than a PNG, and it never needs a retina variant. Drop
  `logo.svg` in and say so — it is a one-word change.
- Alt text is `SLWLRNR`, set in `src/components/site-header.tsx`. Screen readers
  and search engines read that, so the text brand is not lost.
