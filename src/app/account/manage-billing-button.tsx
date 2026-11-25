"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

/** Opens the Stripe Customer Portal for the signed-in user. */
export function ManageBillingButton({ label = "Manage billing" }: { label?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function open() {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/billing/portal", { method: "POST" });
      const data = await r.json();
      if (!r.ok || !data.url) throw new Error(data.error || "Couldn't open billing.");
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't open billing.");
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex flex-col">
      <Button variant="outline" onClick={open} disabled={busy}>
        {busy ? "Opening…" : label}
      </Button>
      {error && <span className="mt-2 text-xs text-ink">{error}</span>}
    </span>
  );
}
