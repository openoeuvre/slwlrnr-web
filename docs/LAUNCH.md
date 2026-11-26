# SLWLRNR — Launch checklist

Everything between "works on Michael's Mac" and "slwlrnr.art is live and taking
money." Lives in the repo so every working thread — site, cards, Create — reads
the same list.

**Legend** · `[ ]` open · `[~]` in progress · `[x]` done
**Owner** · **M** Michael · **C** Claude · **M+C** decide together, Claude builds
**Gate** · **L** blocks launch · **S** soon after launch · **later**

Not legal or tax advice. Items marked ⚖ want a professional's eye before launch.

---

## 0 · Decisions that unblock everything else

These shape the build. Each is a short conversation, not a project.

| | Decision | Recommendation | Owner | Gate |
|---|---|---|---|---|
| [x] | **Sign-in methods** — *decided: Google + email magic link* | Google **plus** email magic link, via Supabase Auth. Google-only shuts out people without Google accounts — notably schools and teachers, a natural Learn audience. Magic links mean no passwords to manage. Apple sign-in later, if an app ever happens. | M | L |
| [x] | **Subscription billing** — *decided: Stripe for Learn + Studio; Shopify keeps prints* | Stripe Billing: Checkout to subscribe, Customer Portal to manage or cancel, webhooks write entitlements into Supabase. Two products (Learn $10, Studio $30), monthly. | M+C | L |
| [x] | **Bundle** — *decided: Learn + Studio $35/mo* (annual pricing still open) | Optional. A Learn + Studio bundle or annual discount is easy to add in Stripe later — decide whether it's there on day one. | M | S |
| [x] | **Create free tier** — *decided: daily cap* (number TBD) | Currently `unlimited_lowres`. **Unlimited means unlimited GPU cost.** Recommend `daily_cap` (e.g. 3–5/day) — it needs the per-user counting Supabase brings anyway. | M | L |
| [ ] | **Account required for free Create?** | Yes (current behaviour). Anonymous GPU access invites abuse and can't be capped per person. | M | L |
| [x] | **Free trial** — *decided: 7 days, card required, on Learn, Studio and the bundle* | Optional. Stripe supports trials natively; decide before building Checkout. | M | S |

---

## 1 · Accounts & identity — Supabase

| | Item | Owner | Gate |
|---|---|---|---|
| [x] | Create Supabase project (one project, shared by all three business lines) | M | L |
| [x] | Google OAuth working locally (own client in Google Cloud; redirect → Supabase callback) | M+C | L |
| [ ] | Google consent screen branding: logo, name, verified slwlrnr.art — today it reads "continue to zuivxhppamdgqgcnwggh.supabase.co". Full fix needs a Supabase custom domain (auth.slwlrnr.art) | M | S |
| [ ] | Production auth URLs: Supabase Site URL → https://slwlrnr.art; add prod + Vercel `/auth/callback` to Supabase redirect URLs; add origins to the Google client | M | L |
| [~] | Email magic link working locally on Supabase's default sender. Still to do: set sender to a slwlrnr.art address (custom SMTP — Supabase's default sender is rate-limited and not for production) | M+C | L |
| [x] | Sign-in page — Google + email magic link, `/auth/callback`, sign-out (`src/app/signin`, `src/app/auth`) | C | L |
| [x] | Schema live — `supabase/migrations/0001`–`0003` (profiles, subscriptions, create_usage, RLS, table grants). **Every new table needs explicit grants** — this project doesn't add them automatically | M | L |
| [x] | **Replace the mock session.** Only `src/lib/entitlements-server.ts` (server) and `src/lib/session.tsx` (client) change — every gate already reads through them | C | L |
| [x] | Dev membership grants disabled in production builds unless `NEXT_PUBLIC_ENABLE_DEV_GRANTS=true` — server ignores the cookie, switcher and mock Subscribe buttons don't render | C | L |
| [~] | Account page: email, membership + trial state, manage billing, sign out — done. Delete account still to do | C | L |
| [ ] | Account deletion actually deletes (or anonymises) data — required by privacy law in several places | C | L |

## 2 · Payments

### Subscriptions — Stripe (Learn, Studio)

| | Item | Owner | Gate |
|---|---|---|---|
| [~] | Stripe account created (test mode); business verification + bank account still to do | M | L |
| [x] | Products + prices in **test mode**: Learn $10, Studio $30, bundle $35 — see `docs/STRIPE.md` | M+C | L |
| [ ] | Recreate products + prices in **live mode** (same IDs, lookup keys, metadata) | M+C | L |
| [ ] | Decide on Stripe Managed Payments (Stripe as merchant of record, handles tax filing) vs. standard + Stripe Tax | M ⚖ | L |
| [x] | Checkout route (`/api/billing/checkout`) — 7-day trial, card required, one membership per person; Paywall offers the bundle | C | L |
| [x] | Webhook handler (`/api/stripe/webhook`): `checkout.session.completed`, `customer.subscription.updated` / `.deleted`, `invoice.payment_failed` → entitlements table. Idempotent; raw-body signature check | C | L |
| [x] | Customer Portal — plan switching, card, invoices, cancel at period end; **Manage billing** on Account | C | L |
| [~] | Failed-payment handling: `past_due` keeps access while Stripe retries, then `canceled`/`unpaid` drops it. Turn on Smart Retries + failed-payment emails in the Stripe Dashboard | M | L |
| [ ] | Stripe Tax — digital subscriptions are taxable in some US states and abroad ⚖ | M | L |
| [~] | End-to-end test in test mode: subscribe → trial → access → plan switch ✓. Still to test: cancel → access ends; failed card (`4000 0000 0000 0341`) | M+C | L |

### Prints — Shopify (already live)

| | Item | Owner | Gate |
|---|---|---|---|
| [ ] | Shopify Payments activated, payouts configured | M | L |
| [ ] | Shipping zones + rates (rolled tube vs. 48" ready-to-hang are very different parcels) | M | L |
| [ ] | Real product weights from the print lab (currently estimated 10 lb / 3 lb for every size) | M | L |
| [ ] | Shopify checkout branding: logo, colours, typography | M | L |
| [ ] | Store policies in Shopify admin: refund, shipping, privacy, terms — Shopify links these from checkout | M | L |
| [ ] | Fulfilment workflow with the print lab: who is notified, turnaround, packaging | M | L |
| [ ] | **Edition pool:** Shopify Flow decrements the sibling variant on each sale (50 shared across both formats) | C | L |
| [ ] | One real test order, refunded | M | L |
| [ ] | Set `productType` to a real category; fill `year` metafields | M | S |

## 3 · Create — the engine in production

| | Item | Owner | Gate |
|---|---|---|---|
| [ ] | Deploy `inference/` to Modal; set `INFERENCE_URL` in Vercel | M+C | L |
| [ ] | **Fix the engine blocking itself:** `/blend` runs the model synchronously inside an async handler, so one blend freezes every other request (including `/systems`). Wrap in a threadpool, or let Modal scale per request | C | L |
| [ ] | Job + polling for `/api/create` — blends take 15–60 s, near Vercel's function limits | C | L |
| [ ] | Upload size: Vercel caps request bodies at ~4.5 MB. Downscale sources in the browser before upload | C | L |
| [x] | Per-user free-tier daily cap — counted in Supabase, enforced in `/api/create` and in the database | C | L |
| [ ] | Rate limiting on `/api/create` for every tier — GPU time is the one cost that scales with abuse | C | L |
| [ ] | Content safety: an upload/output filter. Users supply arbitrary images; you are hosting and processing them ⚖ | M+C | L |
| [ ] | Cost guardrail: Modal spend alert + hard monthly cap | M | L |
| [ ] | Saved blends: `blends` table + storage bucket | C | S |
| [ ] | Upscaler for Studio print-resolution downloads (`upscale.py` is a stub) — the Studio paywall copy currently mentions it as "to follow" | C | S |

## 4 · Learn

| | Item | Owner | Gate |
|---|---|---|---|
| [x] | 24 cards live, explicit free/paid, gated server-side, PDFs behind entitlement check | C | — |
| [ ] | Chladni image for *Salt on a Drum*, Frottage + Gutai fronts (cards thread) | M | S |
| [ ] | Move card PDFs to storage with signed URLs as the deck grows (fine in-bundle at 24) | C | later |

## 5 · Legal & policy ⚖

| | Item | Owner | Gate |
|---|---|---|---|
| [ ] | **Terms of Service** — accounts, subscriptions, auto-renewal and cancellation, acceptable use, user uploads, ownership of Create outputs, termination | M+C ⚖ | L |
| [ ] | **Model licence pass-through.** Create runs on SDXL, licensed CreativeML Open RAIL++-M: commercial use is allowed, but the licence's use-based restrictions must be carried into your own terms. Read the primary licence text, not summaries | M+C ⚖ | L |
| [ ] | **Ownership of outputs:** say plainly what rights users have in their blends (and note that purely machine-generated images may have limited copyright protection) | M ⚖ | L |
| [ ] | **User uploads:** users warrant they have rights to what they upload; you get only the licence needed to process it | M+C ⚖ | L |
| [ ] | **Privacy Policy** — what's collected (account, uploads, payment via Stripe/Shopify, analytics), retention, deletion, processors (Supabase, Stripe, Shopify, Modal, Vercel) | M+C ⚖ | L |
| [ ] | Auto-renewal disclosure at the point of subscribing — several US states require clear terms and easy online cancellation | C ⚖ | L |
| [ ] | Cookie notice — needed if you add analytics/ad cookies or market to EU/UK visitors; essential-only cookies (session, cart) generally don't require consent | M+C ⚖ | L |
| [ ] | DMCA designated agent registered with the US Copyright Office (protects you when users upload infringing images) | M ⚖ | L |
| [ ] | Age policy — under-13s excluded (COPPA); consider 16+/18+ given the Broad series nudes | M ⚖ | L |
| [ ] | Refund policy — subscriptions (none / prorated?) and prints | M | L |
| [ ] | Business entity, sales-tax registrations as thresholds are crossed | M ⚖ | L |
| [ ] | Learn card rights ledger kept on file (`slwlrnr-cards/resolved_launch25.csv`) | — | ✓ |

## 6 · Site content & UX

| | Item | Owner | Gate |
|---|---|---|---|
| [ ] | **Footer links that go nowhere:** About, Shipping & returns, Contact all point to `/` | C | L |
| [ ] | Pages: About, Contact, FAQ, Shipping & Returns, Terms, Privacy | M+C | L |
| [ ] | Paint Systems + Zones series descriptions (still Claude's drafts) | M | L |
| [ ] | Home page gallery copy says every work is made with natural-systems transformations — not true of the painting catalogue | M+C | L |
| [ ] | Your list of small copy/layout/categorisation changes | M | L |
| [ ] | Confirm room-photo scale (`wallInches` from the real sofa length) | M | S |
| [ ] | Transactional email in brand voice: welcome, receipt, payment failed, cancellation | C | L |
| [ ] | Mailing list / newsletter signup (where do new-card announcements go?) | M | S |
| [ ] | Mobile QA pass across every page | M+C | L |
| [ ] | Accessibility pass: keyboard, contrast (strand colours on white), alt text | C | L |
| [ ] | Favicon, Open Graph images, social preview | C | L |

## 7 · Infrastructure

| | Item | Owner | Gate |
|---|---|---|---|
| [x] | **Git repository** — local repo initialised, first commit made; push to a private GitHub repo | M+C | L |
| [~] | Vercel project, environment variables per environment (dev / preview / prod) | M+C | L |
| [x] | ~~Vercel Deployment Protection until real auth ships~~ — real auth and billing are in; dev grants are off in production builds | M | L |
| [ ] | Production build passes (`npm run build`) — never run yet | C | L |
| [ ] | Error monitoring (e.g. Sentry) on site + engine | C | L |
| [ ] | Privacy-friendly analytics | M+C | S |
| [ ] | `robots.txt`, `sitemap.xml`, canonical URLs | C | L |
| [ ] | Uptime monitoring for site + engine | C | S |
| [ ] | Domain cutover from Squarespace — **preserve MX records**; last step | M | L |
| [ ] | Backups: Supabase point-in-time recovery | M | S |

## 8 · Launch day

- [ ] Stripe and Shopify switched from test to live
- [ ] Mock session switcher confirmed absent in production
- [ ] One real purchase of each: a print, Learn, Studio — then refund
- [ ] DNS cut over; email confirmed still working
- [ ] Monitoring watched for the first 48 hours

---

## Suggested order

1. **Decisions (§0)** — one sitting.
2. **Git + Vercel preview** — everything after this gets deployed and testable from a URL.
3. **Supabase auth** — unlocks real entitlements, free-tier counting, saved blends.
4. **Stripe subscriptions** — depends on auth.
5. **Engine to Modal** + the blocking fix, job polling, rate limits — in parallel with 3–4.
6. **Legal pages** — drafted alongside, reviewed by a lawyer before launch.
7. **Content, Shopify ops, QA**, then cutover.
