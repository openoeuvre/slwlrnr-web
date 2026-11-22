"use client";

import Link from "next/link";
import { Container } from "@/components/container";
import { Button, PageHeader, Rule, SpecRow } from "@/components/ui";
import { useSession } from "@/lib/session";
import { PRICING } from "@/lib/tiers";

export default function AccountPage() {
  const { user, entitlements, persona, setPersona } = useSession();

  if (!user) {
    return (
      <Container>
        <PageHeader
          eyebrow="Account"
          title="Sign in"
          intro="Accounts will be handled by Supabase. This build uses a mock session — use the control in the bottom right to switch between states."
        />
        <div className="max-w-sm pb-24">
          <Button className="w-full" onClick={() => setPersona("free")}>
            Continue with a free account
          </Button>
          <p className="mt-3 text-xs leading-relaxed text-faint">
            Mock sign-in. No credentials, no network request.
          </p>
        </div>
      </Container>
    );
  }

  const subs = [
    {
      key: "learn" as const,
      active: entitlements.learn,
      href: "/learn",
      detail: entitlements.learn
        ? "Full library, new cards every other week, print-ready PDFs."
        : "Five free cards. Subscribe for the full library and print-ready PDFs.",
    },
    {
      key: "create" as const,
      active: entitlements.create,
      href: "/create",
      detail: entitlements.create
        ? "Every natural system, four variations at once, full resolution."
        : "Free: the Signature process, low resolution. Studio unlocks every natural system.",
    },
  ];

  return (
    <Container>
      <PageHeader eyebrow="Account" title={user.email} />

      <section className="pb-8">
        <h2 className="label text-faint">Subscriptions</h2>
        <div className="mt-4 grid gap-px bg-rule sm:grid-cols-2">
          {subs.map((s) => {
            const p = PRICING[s.key];
            return (
              <div key={s.key} className="bg-paper p-7">
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="text-lg">{p.name}</h3>
                  <span
                    className={`label ${s.active ? "text-ink" : "text-faint"}`}
                  >
                    {s.active ? "Active" : "Not subscribed"}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {s.detail}
                </p>
                <p className="label mt-6 text-faint tabular-nums">
                  ${p.amount} / {p.interval}
                </p>
                <div className="mt-5">
                  <Link href={s.href} className="label link-underline text-ink">
                    {s.active ? `Go to ${p.name}` : `See ${p.name}`}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="pb-8 pt-10">
        <h2 className="label text-faint">Orders</h2>
        <p className="mt-4 text-sm text-muted">
          No orders yet. Order history, tracking, and returns are served by the
          Shopify customer account API once the store is connected.
        </p>
      </section>

      <Rule className="my-10" />

      <section className="pb-24">
        <h2 className="label text-faint">Session (development)</h2>
        <dl className="mt-4 max-w-md">
          <SpecRow label="Persona">{persona}</SpecRow>
          <SpecRow label="Account">{String(entitlements.account)}</SpecRow>
          <SpecRow label="Learn">{String(entitlements.learn)}</SpecRow>
          <SpecRow label="Create">{String(entitlements.create)}</SpecRow>
        </dl>
        <div className="mt-6">
          <Button variant="outline" onClick={() => setPersona("anonymous")}>
            Sign out
          </Button>
        </div>
      </section>
    </Container>
  );
}
