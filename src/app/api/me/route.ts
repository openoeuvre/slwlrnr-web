import { NextResponse } from "next/server";
import { FREE_TIER } from "@/lib/create/config";
import { freeBlendsUsedToday, freeCap, freeCapApplies } from "@/lib/create/usage-server";
import { DEV_GRANTS_COOKIE, DEV_GRANTS_ENABLED, parseGrants } from "@/lib/dev-grants";
import { getViewer } from "@/lib/entitlements-server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

/** The client's view of the session. Computed server-side; never trusted back. */
export async function GET() {
  const { user, entitlements } = await getViewer();

  let freeBlends: { used: number; cap: number } | null = null;
  if (user && !entitlements.create && freeCapApplies()) {
    freeBlends = { used: await freeBlendsUsedToday(), cap: freeCap() };
  }

  return NextResponse.json(
    {
      user: user ? { email: user.email } : null,
      entitlements,
      freeBlends,
      freeTierMode: FREE_TIER.mode,
      devGrants: {
        enabled: DEV_GRANTS_ENABLED,
        active: [...parseGrants((await cookies()).get(DEV_GRANTS_COOKIE)?.value)],
      },
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
