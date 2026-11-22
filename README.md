# SLWLRNR — local build

One Next.js app, three strands: `/gallery`, `/learn`, `/create`.

Everything runs on mock data. No Shopify store, no Supabase project, no Stripe
account, no GPU. The point of this build is to judge the design and the flow
before any of that exists.

## Run it

```bash
cd slwlrnr-web
npm install
npm run dev
```

Then open http://localhost:3000

```bash
npm run typecheck   # tsc --noEmit
npm run build       # production build
```

## The mock session

Bottom right of every page is a **development-only** control that switches the
session between entitlement states:

| State | What it grants |
| --- | --- |
| Signed out | Browse only |
| Free account | 5 cards, 1 blend, Signature system |
| Learn ($10/mo) | Full card library, print-ready PDFs |
| Create ($30/mo) | All systems, unlimited blends, upscale + download |
| Learn + Create | Both |

Use it to check every locked, unlocked, and paywalled state. Delete
`src/components/tier-switcher.tsx` and its mount in `src/app/layout.tsx` when
real auth lands.

## Where the business model lives

`src/lib/tiers.ts` holds every price, limit, and entitlement check. Nothing
else hard-codes a number. If pricing changes, change it there.

```ts
freeCards: 5        // cards open to everyone
libraryCards: 25    // cards in the library at launch
freeBlends: 1       // finished blends without a subscription
previewEdge: 1024   // free output, longest edge in px
upscaledEdge: 6000  // subscriber output
```

## The four seams

Each of these is a mock today and a real integration later. The interfaces are
already shaped like the thing that will replace them, so the swap is one file.

| File | Mocks | Becomes |
| --- | --- | --- |
| `src/lib/commerce.ts` | Cart, variants, pricing | Shopify Storefront API (types already match its cart shape) |
| `src/lib/session.tsx` | Auth + entitlements | Supabase auth + Stripe subscription state |
| `src/lib/blend.ts` | Generation and upscale | Route handler calling `slwlrnr_blend` via fal.ai / Replicate / local |
| `src/components/system-plate.tsx` | All imagery | `next/image` with real files |

`src/lib/blend.ts` deliberately mirrors the provider protocol in `provider.py`
from the `slwlrnr_blend` package — the local/fal/Replicate abstraction you
already built is why the web layer can be indifferent to the backend.

Copy `.env.example` to `.env.local` when you start connecting things. Nothing
in it is needed to run the mock build.

## No image assets

There are no binary files in this repo. Every artwork, card illustration, and
blend result is a deterministic SVG generated from a seed string by
`SystemPlate`, keyed to the natural system it represents. Same seed, same
image, on server and client. Replace with real photography when it exists —
the props stay the same shape.

## Structure

```
src/
  app/
    page.tsx                    home
    gallery/                    index, [slug] detail, purchase controls
    learn/                      library, [slug] card, gating
    create/                     blend studio
    account/                    mock account + session state
  components/                   header, footer, cart drawer, paywall, plates, primitives
  data/                         artworks, cards, systems registry
  lib/                          tiers, session, cart, commerce, blend
```

## What is real vs. placeholder

**Real, mirrored from Shopify** — `src/data/artworks.ts` now carries the three
Nova products exactly as they exist in the store: titles, handles, your
description copy, 48"×32" from the metafields, edition of 50, real variant GIDs,
and $495 / $1995 pricing. Images come straight off `cdn.shopify.com`. When the
Storefront API is connected, that query returns this same shape and nothing
downstream changes.

**Still placeholder**

- **25 activity cards** — plausible and on-brand, not final.
- **The generative systems registry** — real names, invented descriptions.
- **`/create` output** — mock provider drawing SVG plates, not real diffusion.

**Known limitation:** the product images are 1344×896 (1.2 MP). Across a 48"
work that is ~28 PPI, and the detail view magnifies to 2.6×. Larger files are
the single biggest visual improvement available. Shopify accepts up to 25 MP.

## Product media — three images, one set

Same media for every variant. A correctly installed print reads the same as a
ready-to-hang piece, so there is nothing to gain from splitting them.

| # | Kind | What it is |
| --- | --- | --- |
| 1 | `work` | The artwork, flat. Shopify uses it as the thumbnail. |
| 2 | `room` | In situ, for scale. **Composited at runtime — see below.** |
| 3 | `detail` | Surface crop the visitor can drag and zoom. |

### You do not need a room mockup per artwork

You need **one calibrated room photograph**. Every artwork is placed into it at
correct scale automatically, so adding a work or changing a size needs no
Photoshop.

The one requirement: **shoot square to the wall.** A flat rectangle pasted onto
a flat parallel plane is geometrically correct, so a straight-on shot
composites convincingly. An angled shot is not correct and would need real
perspective work per image.

Scenes live in `src/components/room-plate.tsx`. The current one:

```ts
export const COURTYARD: RoomScene = {
  id: "courtyard-lounge",
  src: "/rooms/courtyard-lounge.jpg",
  wallInches: 134,   // real inches of wall spanned by the square crop
  anchorX: 50,       // centre of a hung work, % of the crop
  anchorY: 35,       // 60" above a floor line at ~79.5%
};
```

**`wallInches` is the one number everything depends on.** It was derived from
the sofa — body ≈ 96" wide, ≈ 32" overall height — which puts the crop at about
134". The pouf (≈29") and rug (≈116") both land in normal ranges at that
figure, so the three agree. If you know the real sofa length:

```
wallInches = 134 × (trueSofaInches / 96)
```

Source images go in `room-sources/` (outside `public/`, so they are not
served). The served copy is a pre-cropped square at 1600px, ~550KB. Pre-
cropping avoids depending on how the browser resolves `object-cover`.

Until a photo exists, a schematic elevation is drawn instead: a 12ft wall, a
60" hang height, a 60" bench for reference.

### The detail view

`ZoomPan` handles drag-to-pan and scroll-to-zoom, clamped so the image can
never be dragged off its own edges. Pointer events, so mouse and touch take the
same path. Supply the highest-resolution file you have for this one — it is the
only place a visitor can inspect the surface.

## To do

- **Unify customer records (later).** Shopify owns print customers; Stripe owns
  both subscriptions. Two dashboards, two customer records — accepted for now.
  Worth revisiting as a light CRM table in Supabase keyed on email, joining
  Shopify order history to subscription state, so one person buying a print and
  subscribing to Learn is visibly one person.

Settled: the registry carries **ten** systems, matching `systems.py`. All
subscriber-facing counts read from `SYSTEMS.length`, so nothing needs updating
if the registry grows.

## Language

Computational collage. Algorithmic transformation. Never "AI art".

## Create — the blending engine

`/create` is the real Create app, merged from `SLWLRNR Local/slwlrnr-create`
(see its `docs/MERGE.md`). The engine stays its own service; the site calls it
over HTTP at `INFERENCE_URL` (`.env.local`, default `http://127.0.0.1:8010`).

Run it alongside the site — two terminals:

```bash
# 1 · engine (wait for "provider ready")
cd ~/"Documents/SLWLRNR Local/slwlrnr-create/inference"
source .venv/bin/activate && export SLWLRNR_DEVICE=mps
python -m uvicorn server:app --port 8010

# 2 · site
cd ~/Documents/slwlrnr-web && npm run dev
```

Rules carried over from Create's `CLAUDE.md`:

- **Natural systems live only in Python** (`inference/slwlrnr_blend/systems.py`).
  The site fetches them from `/systems` — `/create` and the home page list both
  read live. There is deliberately no TypeScript copy.
- **Tier comes from the server-side session**, never the request.
  `/api/create` reads `getEntitlements()`; the engine re-checks as a backstop.
- **Naming:** Create is the section, Studio is the $30 membership.
- **Free-tier behaviour** is one switch: `FREE_TIER.mode` in
  `src/lib/create/config.ts` (currently `unlimited_lowres`, still undecided).

Without the engine running, `/create` shows a notice instead of the catalogue
and the home page hides its systems list — nothing errors.
