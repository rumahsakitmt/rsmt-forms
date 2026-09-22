import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "./auth";

export type StaffSession = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "STAFF";
};

export const getCurrentStaff = cache(async (): Promise<StaffSession | null> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const role = session.user.role === "ADMIN" ? "ADMIN" : "STAFF";
  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role,
  };
});

export async function requireStaff() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login");
  return staff;
}

export async function requireAdmin() {
  const staff = await requireStaff();
  if (staff.role !== "ADMIN") redirect("/");
  return staff;
}
