"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SignOutIcon } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";

export function LogoutButton({ standalone = false }: { standalone?: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const Control = standalone ? Button : SidebarMenuButton;

  return (
    <Control
      type="button"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await authClient.signOut();
        router.push("/login");
        router.refresh();
      }}
    >
      <SignOutIcon data-icon="inline-start" />
      <span>{pending ? "Keluar…" : "Keluar"}</span>
    </Control>
  );
}
