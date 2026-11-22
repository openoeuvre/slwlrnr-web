"use client";

/**
 * DEV ONLY — delete once Stripe is live.
 *
 * Accounts are real now. This panel shows who you're signed in as and lets
 * a signed-in tester grant their own account Learn or Studio, so paid
 * features can be reviewed before billing exists. Grants are honoured only
 * where DEV_GRANTS_ENABLED (see lib/dev-grants.ts); in a production build
 * the panel doesn't render and the server ignores the cookie.
 */

import Link from "next/link";
import { useState } from "react";
import { useSession } from "@/lib/session";
import type { DevGrant } from "@/lib/dev-grants";

const GRANTS: { id: DevGrant; label: string; note: string }[] = [
  { id: "learn", label: "Learn", note: "$10/mo" },
  { id: "studio", label: "Studio", note: "$30/mo" },
];

export function TierSwitcher() {
  const { user, devGrants, setDevGrant, loading } = useSession();
  const [open, setOpen] = useState(false);

  if (loading || !devGrants.enabled) return null;

  const active = new Set(devGrants.active);
  const summary = !user
    ? "Signed out"
    : active.size === 0
      ? "Free account"
      : [...active].map((g) => (g === "learn" ? "Learn" : "Studio")).join(" + ");

  return (
    <div className="fixed bottom-4 right-4 z-50 print:hidden">
      {open && (
        <div className="mb-2 w-64 border border-ink bg-paper shadow-[0_2px_24px_rgba(0,0,0,0.08)]">
          <p className="label border-b border-rule px-3 py-2 text-faint">
            Dev · memberships
          </p>

          <div className="border-b border-rule px-3 py-2.5 text-xs leading-relaxed">
            {user ? (
              <span className="text-muted">Signed in as {user.email}</span>
            ) : (
              <Link href="/signin" className="link-underline text-ink">
                Sign in to test memberships
              </Link>
            )}
          </div>

          <ul>
            {GRANTS.map((g) => {
              const on = active.has(g.id);
              return (
                <li key={g.id}>
                  <button
                    disabled={!user}
                    onClick={() => setDevGrant(g.id, !on)}
                    aria-pressed={on}
                    className={`flex w-full items-baseline justify-between gap-3 px-3 py-2.5 text-left text-sm transition-colors disabled:opacity-40 ${
                      on ? "bg-ink text-paper" : "text-ink hover:bg-wash"
                    }`}
                  >
                    <span>
                      {on ? "✓ " : ""}
                      {g.label}
                    </span>
                    <span className={`label ${on ? "text-paper/60" : "text-faint"}`}>
                      {g.note}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="border-t border-rule px-3 py-2 text-[0.6875rem] leading-snug text-faint">
            Grants your own account access for testing. Not shown in production.
          </p>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className="label flex h-9 items-center gap-2 border border-ink bg-paper px-3 text-ink hover:bg-wash"
        aria-expanded={open}
      >
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-ink" aria-hidden />
        {summary}
      </button>
    </div>
  );
}
