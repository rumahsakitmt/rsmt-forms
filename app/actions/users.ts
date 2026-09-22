"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { requireAdmin } from "@/lib/session";

export type CreateStaffState = {
  success: boolean;
  message: string;
  errors?: Record<string, string>;
};

const staffSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter."),
  email: z.email("Alamat email tidak valid."),
  password: z.string().min(10, "Kata sandi minimal 10 karakter."),
  role: z.enum(["STAFF", "ADMIN"]),
});

export async function createStaffAction(
  _previous: CreateStaffState,
  formData: FormData,
): Promise<CreateStaffState> {
  await requireAdmin();
  const parsed = staffSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) errors[String(issue.path[0])] = issue.message;
    return { success: false, message: "Periksa data akun.", errors };
  }

  try {
    await auth.api.createUser({
      headers: await headers(),
      body: { ...parsed.data, role: parsed.data.role as never },
    });
    revalidatePath("/admin/users");
    return { success: true, message: "Akun staf berhasil dibuat." };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Akun tidak dapat dibuat.",
    };
  }
}
