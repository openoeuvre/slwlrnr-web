import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Container } from "@/components/container";
import { safeNext } from "@/lib/safe-next";
import { createClient } from "@/lib/supabase/server";
import { SignInForm } from "./signin-form";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  const destination = safeNext(next);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect(destination);

  return (
    <Container>
      <div className="mx-auto max-w-md py-20 sm:py-28">
        <p className="label text-faint">Account</p>
        <h1 className="display mt-6 text-[2.5rem] sm:text-[3rem]">Sign in</h1>
        <p className="mt-4 text-[0.9375rem] leading-[1.65] text-muted">
          One account for everything — the gallery, Learn and Create. New here?
          Signing in creates your account.
        </p>
        <SignInForm next={destination} initialError={error ?? null} />
      </div>
    </Container>
  );
}
