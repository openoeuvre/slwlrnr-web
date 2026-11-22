"use client";

/**
 * DEV ONLY. Remove this component when real auth lands.
 * Floating control that flips the mock session between entitlement states so
 * every paywall and locked state can be reviewed without signing up.
 */

import { useState } from "react";
import { MOCK_SESSION_ENABLED, PERSONAS, useSession } from "@/lib/session";

export function TierSwitcher() {
  const { persona, setPersona } = useSession();
  const [open, setOpen] = useState(false);

  const current = PERSONAS.find((p) => p.id === persona);

  // Not rendered at all where the mock session is disabled (production).
  if (!MOCK_SESSION_ENABLED) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 print:hidden">
      {open && (
        <div className="mb-2 w-60 border border-ink bg-paper shadow-[0_2px_24px_rgba(0,0,0,0.08)]">
          <p className="label border-b border-rule px-3 py-2 text-faint">
            Mock session
          </p>
          <ul>
            {PERSONAS.map((p) => {
              const active = p.id === persona;
              return (
                <li key={p.id}>
                  <button
                    onClick={() => setPersona(p.id)}
                    className={`flex w-full items-baseline justify-between gap-3 px-3 py-2.5 text-left text-sm transition-colors ${
                      active
                        ? "bg-ink text-paper"
                        : "hover:bg-wash text-ink"
                    }`}
                  >
                    <span>{p.label}</span>
                    <span
                      className={`label ${active ? "text-paper/60" : "text-faint"}`}
                    >
                      {p.note}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="border-t border-rule px-3 py-2 text-[0.6875rem] leading-snug text-faint">
            Development control. Not part of the shipped interface.
          </p>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className="label flex h-9 items-center gap-2 border border-ink bg-paper px-3 text-ink hover:bg-wash"
        aria-expanded={open}
      >
        <span
          className="inline-block h-1.5 w-1.5 rounded-full bg-ink"
          aria-hidden
        />
        {current?.label ?? "Session"}
      </button>
    </div>
  );
}
