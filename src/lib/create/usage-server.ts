import "server-only";

import { createClient } from "@/lib/supabase/server";
import { FREE_TIER } from "./config";

const today = () => new Date().toISOString().slice(0, 10); // UTC, matches the SQL

/** Free blends used today by the signed-in user. */
export async function freeBlendsUsedToday(): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("create_usage")
    .select("count")
    .eq("day", today())
    .maybeSingle();
  return data?.count ?? 0;
}

/**
 * Record one free blend. Done AFTER a successful blend so failures don't
 * cost the user. consume_free_blend() refuses past the cap in the database
 * itself, so the cap holds even if this app is bypassed.
 */
export async function recordFreeBlend(): Promise<void> {
  const supabase = await createClient();
  await supabase.rpc("consume_free_blend", { p_cap: FREE_TIER.dailyCap });
}

export function freeCapApplies(): boolean {
  return FREE_TIER.mode === "daily_cap" || FREE_TIER.mode === "one_blend";
}

export function freeCap(): number {
  return FREE_TIER.mode === "one_blend" ? 1 : FREE_TIER.dailyCap;
}
