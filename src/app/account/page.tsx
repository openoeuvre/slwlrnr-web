import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Container } from "@/components/container";
import { PageHeader, Rule, SpecRow } from "@/components/ui";
import { freeBlendsUsedToday, freeCap, freeCapApplies } from "@/lib/create/usage-server";
import { getViewer } from "@/lib/entitlements-server";
import { PRICING } from "@/lib/tiers";
import { SignOutButton } from "./sign-out-button";

export const metadata: Metadata = { title: "Account" };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const { user, entitlements } = await getViewer();
  if (!user) redirect("/signin?next=/account");

  const usage =
    !entitlements.create && freeCapApplies()
      ? { used: await freeBlendsUsedToday(), cap: freeCap() }
      : null;

  const memberships = [
    {
      key: "learn" as const,
      active: entitlements.learn,
      href: "/learn",
      detail: entitlements.learn
        ? "The full card library, every essay and glossary, print-ready PDFs."
        : "Five free cards. Subscribe for the full library and print-ready PDFs.",
    },
    {
      key: "create" as const,
      active: entitlements.create,
      href: "/create",
      detail: entitlements.create
        ? "Every natural system, four variations at once, full resolution."
        : `Free: the Signature process, low resolution${
            usage ? ` — ${Math.max(0, usage.cap - usage.used)} of ${usage.cap} blends left today` : ""
          }. Studio unlocks every natural system.`,
    },
  ];

  return (
    <Container>
      <PageHeader eyebrow="Account" title={user.email ?? "Your account"} />

      <section className="pb-8">
        <h2 className="label text-faint">Memberships</h2>
        <div className="mt-4 grid gap-px bg-rule sm:grid-cols-2">
          {memberships.map((m) => {
            const p = PRICING[m.key];
            return (
              <div key={m.key} className="bg-paper p-7">
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="text-lg">{p.name}</h3>
                  <span className={`label ${m.active ? "text-ink" : "text-faint"}`}>
                    {m.active ? "Active" : "Not subscribed"}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted">{m.detail}</p>
                <p className="label mt-6 text-faint tabular-nums">
                  ${p.amount} / {p.interval}
                </p>
                <div className="mt-5">
                  <Link href={m.href} className="label link-underline text-ink">
                    {m.active ? `Go to ${m.key === "learn" ? "Learn" : "Create"}` : `See ${p.name}`}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-xs leading-relaxed text-faint">
          Billing, receipts and cancellation will be managed here once payments open.
        </p>
      </section>

      <section className="pb-8 pt-10">
        <h2 className="label text-faint">Orders</h2>
        <p className="mt-4 text-sm text-muted">
          Print orders are confirmed by email from the SLWLRNR shop, with tracking once they ship.
        </p>
      </section>

      <Rule className="my-10" />

      <section className="pb-24">
        <dl className="max-w-md">
          <SpecRow label="Signed in as">{user.email}</SpecRow>
        </dl>
        <div className="mt-6">
          <SignOutButton />
        </div>
      </section>
    </Container>
  );
}
