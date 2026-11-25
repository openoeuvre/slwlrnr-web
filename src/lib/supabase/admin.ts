import "server-only";

import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./config";

/**
 * Supabase with the SECRET key — bypasses Row Level Security.
 *
 * Only for trusted server code that acts on no one's behalf: the Stripe
 * webhook writing subscriptions, and storing a user's Stripe customer ID.
 * Never import this anywhere a user's input decides which rows it touches
 * without checking first.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!SUPABASE_URL || !key) {
    throw new Error("SUPABASE_SECRET_KEY is not set.");
  }
  return createClient(SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
