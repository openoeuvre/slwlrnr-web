"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

/** Two-step: reveal, then type "delete" to confirm. */
export function DeleteAccount({ hasMembership }: { hasMembership: boolean }) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ confirm: "delete" }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || "Couldn't delete your account.");
      window.location.href = "/?account=deleted";
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't delete your account.");
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="label link-underline text-faint hover:text-ink"
      >
        Delete account
      </button>
    );
  }

  return (
    <div className="max-w-md border border-rule p-6">
      <h3 className="text-[0.9375rem]">Delete your account</h3>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        This permanently removes your account and your Create history.
        {hasMembership &&
          " Your membership ends immediately and you won't be charged again; the current period isn't refunded."}{" "}
        Past invoices are kept by our payment processor, as the law requires. Print orders
        are unaffected.
      </p>
      <label className="label mt-5 block text-faint" htmlFor="confirm-delete">
        Type “delete” to confirm
      </label>
      <input
        id="confirm-delete"
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        autoComplete="off"
        className="mt-2 w-full border border-rule bg-paper px-3 py-2 text-sm outline-none focus:border-ink"
      />
      <div className="mt-5 flex items-center gap-5">
        <Button onClick={remove} disabled={busy || typed.trim().toLowerCase() !== "delete"}>
          {busy ? "Deleting…" : "Delete permanently"}
        </Button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setTyped("");
          }}
          className="label link-underline text-faint hover:text-ink"
          disabled={busy}
        >
          Keep my account
        </button>
      </div>
      {error && <p className="mt-3 text-xs text-ink">{error}</p>}
    </div>
  );
}
