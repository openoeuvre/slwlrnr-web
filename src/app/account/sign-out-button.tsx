"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { useSession } from "@/lib/session";

export function SignOutButton() {
  const { signOut } = useSession();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="outline"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await signOut();
      }}
    >
      {busy ? "Signing out…" : "Sign out"}
    </Button>
  );
}
