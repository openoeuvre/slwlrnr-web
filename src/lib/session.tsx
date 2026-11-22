"use client";

/**
 * MOCK SESSION.
 *
 * Stands in for Supabase auth + Stripe entitlements so the whole app can be
 * designed and reviewed without either service existing yet.
 *
 * The persona lives in a cookie rather than localStorage so the SERVER can
 * read it too — paid card content is gated server-side and never sent to a
 * non-subscriber. Changing persona writes the cookie and refreshes the route
 * so server components re-render with the new entitlements.
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
import {
  ENTITLEMENTS,
  PERSONA_COOKIE,
  PERSONAS,
  isPersona,
  type MockPersona,
} from "./personas";
import type { Entitlements } from "./tiers";

export { PERSONAS, type MockPersona };

type SessionValue = {
  persona: MockPersona;
  setPersona: (p: MockPersona) => void;
  entitlements: Entitlements;
  user: { email: string } | null;
  /** Blends consumed this period. Reset by the switcher. */
  blendsUsed: number;
  recordBlend: () => void;
  resetBlends: () => void;
};

const SessionContext = createContext<SessionValue | null>(null);

function readCookie(): MockPersona {
  const m = document.cookie.match(new RegExp(`(?:^|; )${PERSONA_COOKIE}=([^;]*)`));
  const v = m ? decodeURIComponent(m[1]) : null;
  return isPersona(v) ? v : "anonymous";
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [persona, setPersonaState] = useState<MockPersona>("anonymous");
  const [blendsUsed, setBlendsUsed] = useState(0);

  // Read after mount so server and first client render agree.
  useEffect(() => {
    setPersonaState(readCookie());
  }, []);

  const setPersona = useCallback(
    (p: MockPersona) => {
      setPersonaState(p);
      setBlendsUsed(0);
      document.cookie = `${PERSONA_COOKIE}=${p}; path=/; max-age=31536000; samesite=lax`;
      // Server components (gated card content) re-render with the new cookie.
      router.refresh();
    },
    [router],
  );

  const value = useMemo<SessionValue>(
    () => ({
      persona,
      setPersona,
      entitlements: ENTITLEMENTS[persona],
      user: persona === "anonymous" ? null : { email: `${persona}@example.com` },
      blendsUsed,
      recordBlend: () => setBlendsUsed((n) => n + 1),
      resetBlends: () => setBlendsUsed(0),
    }),
    [persona, setPersona, blendsUsed],
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
