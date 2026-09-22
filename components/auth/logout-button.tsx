"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconLogout2 } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <Button
      type="button"
      className="nav-link nav-link-button h-11 justify-start px-3 text-xs text-white/70 hover:bg-white/7 hover:text-white"
      variant="ghost"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await authClient.signOut();
        router.push("/login");
        router.refresh();
      }}
    >
      <IconLogout2 size={19} />
      <span>{pending ? "Keluar…" : "Keluar"}</span>
    </Button>
  );
}
