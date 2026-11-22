"use client";

/**
 * Session context for client components.
 *
 * The truth lives on the server (/api/me, computed from the Supabase session
 * and subscriptions). This context mirrors it for display — header, account
 * page, paywall buttons — and refreshes whenever the auth state changes.
 * Never gate anything on these values alone; the server re-checks.
 */

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { DEV_GRANTS_COOKIE, type DevGrant } from "./dev-grants";
import { createClient } from "./supabase/browser";
import { supabaseConfigured } from "./supabase/config";
import { ANONYMOUS, type Entitlements } from "./tiers";

type Me = {
  user: { email: string | null } | null;
  entitlements: Entitlements;
  freeBlends: { used: number; cap: number } | null;
  devGrants: { enabled: boolean; active: DevGrant[] };
};

type SessionValue = Me & {
  loading: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
  setDevGrant: (grant: DevGrant, on: boolean) => Promise<void>;
};

const EMPTY: Me = {
  user: null,
  entitlements: ANONYMOUS,
  freeBlends: null,
  devGrants: { enabled: false, active: [] },
};

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [me, setMe] = useState<Me>(EMPTY);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const r = await fetch("/api/me", { cache: "no-store" });
      if (r.ok) setMe((await r.json()) as Me);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    if (!supabaseConfigured) return;
    const { data } = createClient().auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        refresh();
        router.refresh();
      }
    });
    return () => data.subscription.unsubscribe();
  }, [refresh, router]);

  const signOut = useCallback(async () => {
    await createClient().auth.signOut();
    await fetch("/auth/signout", { method: "POST" });
    await refresh();
    router.push("/");
    router.refresh();
  }, [refresh, router]);

  const setDevGrant = useCallback(
    async (grant: DevGrant, on: boolean) => {
      const next = new Set(me.devGrants.active);
      if (on) next.add(grant);
      else next.delete(grant);
      document.cookie = `${DEV_GRANTS_COOKIE}=${encodeURIComponent(
        [...next].join(","),
      )}; path=/; max-age=31536000; samesite=lax`;
      await refresh();
      router.refresh(); // server components re-render with the new grants
    },
    [me.devGrants.active, refresh, router],
  );

  const value = useMemo<SessionValue>(
    () => ({ ...me, loading, refresh, signOut, setDevGrant }),
    [me, loading, refresh, signOut, setDevGrant],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside <SessionProvider>");
  return ctx;
}
