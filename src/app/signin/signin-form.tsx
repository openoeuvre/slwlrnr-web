"use client";

import { useState } from "react";
import { Button, Note } from "@/components/ui";
import { createClient } from "@/lib/supabase/browser";

export function SignInForm({
  next,
  initialError,
}: {
  next: string;
  initialError: string | null;
}) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState<null | "google" | "email">(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(initialError);

  const callback = () =>
    `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  async function google() {
    setBusy("google");
    setError(null);
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callback() },
    });
    // On success the browser is already navigating to Google.
    if (error) {
      setError(error.message);
      setBusy(null);
    }
  }

  async function magicLink(e: React.FormEvent) {
    e.preventDefault();
    setBusy("email");
    setError(null);
    const { error } = await createClient().auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: callback(), shouldCreateUser: true },
    });
    setBusy(null);
    if (error) setError(error.message);
    else setSentTo(email.trim());
  }

  if (sentTo) {
    return (
      <div className="mt-10 border-t border-rule pt-8">
        <p className="label text-faint">Check your email</p>
        <p className="mt-3 text-[0.9375rem] leading-relaxed">
          We sent a sign-in link to <span className="text-ink">{sentTo}</span>.
          Open it in this browser to finish.
        </p>
        <button
          onClick={() => setSentTo(null)}
          className="label link-underline mt-6 text-muted"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <div className="mt-10">
      <Button
        variant="outline"
        className="w-full"
        onClick={google}
        disabled={busy !== null}
      >
        {busy === "google" ? "Opening Google…" : "Continue with Google"}
      </Button>

      <div className="my-8 flex items-center gap-4">
        <span className="h-px flex-1 bg-rule" />
        <span className="label text-faint">or</span>
        <span className="h-px flex-1 bg-rule" />
      </div>

      <form onSubmit={magicLink}>
        <label className="block">
          <span className="label text-faint">Email</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="mt-2 h-11 w-full border border-rule bg-paper px-3 text-sm outline-none focus:border-ink"
          />
        </label>
        <Button type="submit" className="mt-4 w-full" disabled={busy !== null}>
          {busy === "email" ? "Sending…" : "Email me a sign-in link"}
        </Button>
        <p className="mt-3 text-xs leading-relaxed text-faint">
          No password. We email you a link that signs you in.
        </p>
      </form>

      {error && (
        <div className="mt-8">
          <Note>{error}</Note>
        </div>
      )}
    </div>
  );
}
