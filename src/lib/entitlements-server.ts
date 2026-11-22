import "server-only";

/**
 * Who is this, and what may they use? Every gate in the app goes through here.
 *
 *  - account  a real, signed-in Supabase user
 *  - learn    an active Learn subscription   (or a dev grant)
 *  - create   an active Studio subscription  (or a dev grant)
 *
 * Subscriptions are read as the user, under Row Level Security, from the
 * `subscriptions` table that the Stripe webhook will maintain.
 */

import { cookies } from "next/headers";
import { DEV_GRANTS_COOKIE, parseGrants } from "./dev-grants";
import { supabaseConfigured } from "./supabase/config";
import { createClient } from "./supabase/server";
import { ANONYMOUS, type Entitlements } from "./tiers";

/** Stripe statuses that still grant access. past_due = card-retry grace period. */
const LIVE = new Set(["active", "trialing", "past_due"]);

export type Viewer = {
  user: { id: string; email: string | null } | null;
  entitlements: Entitlements;
};

export async function getViewer(): Promise<Viewer> {
  if (!supabaseConfigured) return { user: null, entitlements: ANONYMOUS };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, entitlements: ANONYMOUS };

  const { data: subs } = await supabase
    .from("subscriptions")
    .select("product, status, current_period_end");

  const now = Date.now();
  const has = (product: "learn" | "studio") =>
    (subs ?? []).some(
      (s) =>
        s.product === product &&
        LIVE.has(s.status) &&
        (!s.current_period_end || Date.parse(s.current_period_end) > now),
    );

  const grants = parseGrants((await cookies()).get(DEV_GRANTS_COOKIE)?.value);

  return {
    user: { id: user.id, email: user.email ?? null },
    entitlements: {
      account: true,
      learn: has("learn") || grants.has("learn"),
      create: has("studio") || grants.has("studio"),
    },
  };
}

export async function getEntitlements(): Promise<Entitlements> {
  return (await getViewer()).entitlements;
}
