import { NextResponse } from "next/server";
import { safeNext } from "@/lib/safe-next";
import { createClient } from "@/lib/supabase/server";

/**
 * Landing point for both Google sign-in and email magic links. Supabase
 * redirects here with a one-time `code`, which is exchanged for a session
 * cookie (PKCE). The code verifier is stored in the browser that started
 * sign-in, so a magic link must be opened in the same browser.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
    return NextResponse.redirect(
      `${origin}/signin?error=${encodeURIComponent(error.message)}`,
    );
  }

  const providerError = searchParams.get("error_description");
  return NextResponse.redirect(
    `${origin}/signin?error=${encodeURIComponent(providerError ?? "That sign-in link didn't work.")}`,
  );
}
