/**
 * MOCK PERSONAS — shared by client and server.
 *
 * Lives outside session.tsx because that file is "use client", and a server
 * component importing from a client module receives references, not values.
 *
 * The persona is stored in a cookie so the server can gate paid content
 * before it is sent. When Supabase lands, the cookie read in
 * entitlements-server.ts is replaced by a real session lookup; nothing that
 * consumes Entitlements changes.
 */

import { ANONYMOUS, type Entitlements } from "./tiers";

export type MockPersona = "anonymous" | "free" | "learn" | "create" | "both";

export const PERSONA_COOKIE = "slwlrnr_persona";

export const PERSONAS: { id: MockPersona; label: string; note: string }[] = [
  { id: "anonymous", label: "Signed out", note: "No account" },
  { id: "free", label: "Free account", note: "5 cards · Signature" },
  { id: "learn", label: "Learn", note: "$10/mo" },
  { id: "create", label: "Studio", note: "$30/mo" },
  { id: "both", label: "Learn + Studio", note: "$40/mo" },
];

export const ENTITLEMENTS: Record<MockPersona, Entitlements> = {
  anonymous: ANONYMOUS,
  free: { account: true, learn: false, create: false },
  learn: { account: true, learn: true, create: false },
  create: { account: true, learn: false, create: true },
  both: { account: true, learn: true, create: true },
};

export function isPersona(v: unknown): v is MockPersona {
  return typeof v === "string" && v in ENTITLEMENTS;
}
