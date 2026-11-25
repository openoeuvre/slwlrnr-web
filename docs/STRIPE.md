# Stripe — memberships

Stripe handles **subscriptions only** (Learn, Studio, the bundle). Prints are
sold through Shopify's own checkout and never touch Stripe.

Plan accepted from Stripe's implementation planner (guide
`iguide_61VpByxyvtHkU8USj41HwUx5WeiBc`), with the deviations noted below.

## Products (test mode — account "SLWLRNR sandbox")

Product IDs are fixed and human-readable; the site looks prices up by
**lookup key**, never by `price_…` ID, so prices can be changed in Stripe
without a code change (create a new price, move the lookup key to it).

| Membership | Product | Lookup key | Price | Tax code | Grants |
|---|---|---|---|---|---|
| Learn | `slwlrnr_learn` | `slwlrnr_learn_monthly` | $10/mo | `txcd_10503002` Digital documents — downloadable — subscription | learn |
| Studio | `slwlrnr_studio` | `slwlrnr_studio_monthly` | $30/mo | `txcd_10105001` AI as a Service — cloud — personal use | studio |
| Learn + Studio | `slwlrnr_bundle` | `slwlrnr_bundle_monthly` | $35/mo | `txcd_10105001` | learn, studio |

All prices: USD, monthly, `tax_behavior: exclusive` (US convention — tax is
added on top when collection is switched on). Each product and price carries
`metadata.grants`, which the webhook uses to decide what the subscription
unlocks.

**Live mode:** these exist in test mode only. Before launch, recreate them in
live mode with the same IDs, lookup keys and metadata.

## Decisions

- **Checkout:** Stripe-hosted, redirect.
- **Trial:** 7 days, card required, all three memberships — set on the Checkout
  Session (`subscription_data.trial_period_days`). The planner's "trial offers"
  blueprint creates subscriptions outside Checkout; not used.
- **One membership per person:** enforced by the site — anyone with a live
  subscription is sent to the Customer Portal to switch plans instead of
  opening a second Checkout.
- **Customer Portal:** cards, invoices, cancel at period end, and switching
  between the three prices.
- **Failed payments:** Smart Retries + Stripe's emails (Dashboard settings).
- **Tax:** free threshold monitoring for now; turn on collection when Stripe
  flags a threshold. Tax codes chosen by Michael; have an adviser confirm.
- **Not used:** Managed Payments (Stripe as merchant of record) — revisit before
  launch. Stripe Invoicing — institutional print orders go through Shopify
  draft orders.

## Webhook events

`checkout.session.completed`, `customer.subscription.created`,
`customer.subscription.updated`, `customer.subscription.deleted`,
`invoice.paid`, `invoice.payment_failed`.

## Testing locally

Keep three terminals running: the site (`npm run dev`), the Create engine if
needed, and Stripe's event forwarder:

```bash
stripe listen \
  --events checkout.session.completed,customer.subscription.created,customer.subscription.updated,customer.subscription.deleted,invoice.paid,invoice.payment_failed \
  --forward-to localhost:3000/api/stripe/webhook
```

Current Stripe CLI versions require `--events` (or `--all-snapshot`). It prints
a `whsec_…` signing secret — put it in `.env.local` as `STRIPE_WEBHOOK_SECRET`
and restart `npm run dev`. The secret stays the same across `stripe listen`
runs on the same machine.

Test card: `4242 4242 4242 4242`, any future expiry, any CVC. Others (declines,
3-D Secure) at https://docs.stripe.com/testing.

Each forwarded event shows `[200]` when the site handled it. `[500]` usually
means `0002_billing.sql` hasn't been run, or `SUPABASE_SECRET_KEY` is missing.
