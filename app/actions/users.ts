"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import {
  deleteUserBlockReason,
  roleChangeBlockReason,
} from "@/lib/users/admin-user-policy";

export type StaffActionState = {
  success: boolean;
  message: string;
  errors?: Record<string, string>;
};

export type CreateStaffState = StaffActionState;

const staffSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter."),
  email: z.email("Alamat email tidak valid.").trim().toLowerCase(),
  password: z.string().min(10, "Kata sandi minimal 10 karakter."),
  role: z.enum(["STAFF", "ADMIN"]),
});

const updateStaffSchema = staffSchema.omit({ password: true });

const resetPasswordSchema = z
  .object({
    password: z.string().min(10, "Kata sandi minimal 10 karakter."),
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Konfirmasi kata sandi tidak cocok.",
    path: ["confirmPassword"],
  });

function validationErrors(error: z.ZodError) {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0]);
    if (!errors[field]) errors[field] = issue.message;
  }
  return errors;
}

function userMutationError(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  if (message.includes("already exists") || message.includes("unique")) {
    return "Email tersebut sudah digunakan akun lain.";
  }
  return fallback;
}

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
    return {
      success: false,
      message: "Periksa data akun.",
      errors: validationErrors(parsed.error),
    };
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
      message: userMutationError(error, "Akun tidak dapat dibuat."),
    };
  }
}

export async function updateStaffAction(
  userId: string,
  formData: FormData,
): Promise<StaffActionState> {
  const administrator = await requireAdmin();
  const parsed = updateStaffSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Periksa perubahan akun.",
      errors: validationErrors(parsed.error),
    };
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!user) return { success: false, message: "Pengguna tidak ditemukan." };

  const currentRole = user.role === "ADMIN" ? "ADMIN" : "STAFF";
  const isDemotion = currentRole === "ADMIN" && parsed.data.role === "STAFF";
  const administratorCount = isDemotion
    ? await db.user.count({ where: { role: "ADMIN" } })
    : 0;
  const roleBlockReason = roleChangeBlockReason({
    administratorId: administrator.id,
    targetUserId: userId,
    currentRole,
    nextRole: parsed.data.role,
    administratorCount,
  });
  if (roleBlockReason) {
    return { success: false, message: roleBlockReason };
  }

  try {
    const requestHeaders = await headers();
    await auth.api.adminUpdateUser({
      headers: requestHeaders,
      body: { userId, data: parsed.data },
    });
    if (isDemotion) {
      await auth.api.revokeUserSessions({
        headers: requestHeaders,
        body: { userId },
      });
    }
    revalidatePath("/admin/users");
    return { success: true, message: "Data pengguna berhasil diperbarui." };
  } catch (error) {
    return {
      success: false,
      message: userMutationError(error, "Data pengguna tidak dapat diperbarui."),
    };
  }
}

export async function resetStaffPasswordAction(
  userId: string,
  formData: FormData,
): Promise<StaffActionState> {
  const administrator = await requireAdmin();
  if (administrator.id === userId) {
    return {
      success: false,
      message: "Ubah kata sandi akun sendiri melalui halaman Akun saya.",
    };
  }

  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return {
      success: false,
      message: "Periksa kata sandi baru.",
      errors: validationErrors(parsed.error),
    };
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (!user) return { success: false, message: "Pengguna tidak ditemukan." };

  const requestHeaders = await headers();
  try {
    await auth.api.setUserPassword({
      headers: requestHeaders,
      body: { userId, newPassword: parsed.data.password },
    });
  } catch {
    return { success: false, message: "Kata sandi tidak dapat diatur ulang." };
  }

  try {
    await auth.api.revokeUserSessions({
      headers: requestHeaders,
      body: { userId },
    });
  } catch {
    return {
      success: false,
      message:
        "Kata sandi sudah diperbarui, tetapi sesi aktif tidak dapat diakhiri.",
    };
  }

  return {
    success: true,
    message: "Kata sandi diperbarui dan seluruh sesi pengguna diakhiri.",
  };
}

export async function deleteStaffAction(
  userId: string,
): Promise<StaffActionState> {
  const administrator = await requireAdmin();
  if (administrator.id === userId) {
    return { success: false, message: "Anda tidak dapat menghapus akun sendiri." };
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      _count: {
        select: { submissions: true, updates: true, auditEvents: true },
      },
    },
  });
  if (!user) return { success: false, message: "Pengguna tidak ditemukan." };

  const targetRole = user.role === "ADMIN" ? "ADMIN" : "STAFF";
  const administratorCount =
    targetRole === "ADMIN"
      ? await db.user.count({ where: { role: "ADMIN" } })
      : 0;
  const hasClinicalHistory =
    user._count.submissions > 0 ||
    user._count.updates > 0 ||
    user._count.auditEvents > 0;
  const deleteBlockReason = deleteUserBlockReason({
    administratorId: administrator.id,
    targetUserId: userId,
    targetRole,
    administratorCount,
    hasClinicalHistory,
  });
  if (deleteBlockReason) {
    return { success: false, message: deleteBlockReason };
  }

  try {
    await auth.api.removeUser({
      headers: await headers(),
      body: { userId },
    });
    revalidatePath("/admin/users");
    return { success: true, message: "Akun pengguna berhasil dihapus." };
  } catch {
    return {
      success: false,
      message: "Akun tidak dapat dihapus karena masih terhubung dengan data lain.",
    };
  }
}
