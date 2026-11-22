import "server-only";

/**
 * Server-side entitlement lookup.
 *
 * Today this reads the mock persona cookie. When Supabase and Stripe land,
 * replace the body with a real session + subscription lookup. The return
 * shape is the contract — every gate in the app goes through here.
 */

import { cookies } from "next/headers";
import {
  ENTITLEMENTS,
  MOCK_SESSION_ENABLED,
  PERSONA_COOKIE,
  isPersona,
} from "./personas";
import { ANONYMOUS, type Entitlements } from "./tiers";

export async function getEntitlements(): Promise<Entitlements> {
  // With the mock disabled, nobody is entitled to anything until real auth.
  if (!MOCK_SESSION_ENABLED) return ANONYMOUS;
  const value = (await cookies()).get(PERSONA_COOKIE)?.value;
  return isPersona(value) ? ENTITLEMENTS[value] : ANONYMOUS;
}
