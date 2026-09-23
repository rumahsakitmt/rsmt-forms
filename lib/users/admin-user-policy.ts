type Role = "ADMIN" | "STAFF";

export function roleChangeBlockReason({
  administratorId,
  targetUserId,
  currentRole,
  nextRole,
  administratorCount,
}: {
  administratorId: string;
  targetUserId: string;
  currentRole: Role;
  nextRole: Role;
  administratorCount: number;
}) {
  const isDemotion = currentRole === "ADMIN" && nextRole === "STAFF";
  if (!isDemotion) return null;
  if (administratorId === targetUserId) {
    return "Anda tidak dapat menurunkan peran akun sendiri.";
  }
  if (administratorCount <= 1) {
    return "Minimal satu administrator harus tetap aktif.";
  }
  return null;
}

export function deleteUserBlockReason({
  administratorId,
  targetUserId,
  targetRole,
  administratorCount,
  hasClinicalHistory,
}: {
  administratorId: string;
  targetUserId: string;
  targetRole: Role;
  administratorCount: number;
  hasClinicalHistory: boolean;
}) {
  if (administratorId === targetUserId) {
    return "Anda tidak dapat menghapus akun sendiri.";
  }
  if (targetRole === "ADMIN" && administratorCount <= 1) {
    return "Administrator terakhir tidak dapat dihapus.";
  }
  if (hasClinicalHistory) {
    return "Akun memiliki riwayat klinis dan tidak dapat dihapus. Ubah perannya jika akses perlu dibatasi.";
  }
  return null;
}
