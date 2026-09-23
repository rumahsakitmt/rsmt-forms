import { describe, expect, it } from "vitest";

import {
  deleteUserBlockReason,
  roleChangeBlockReason,
} from "@/lib/users/admin-user-policy";

describe("admin user policy", () => {
  it("blocks self-demotion and keeps one administrator", () => {
    expect(
      roleChangeBlockReason({
        administratorId: "admin-1",
        targetUserId: "admin-1",
        currentRole: "ADMIN",
        nextRole: "STAFF",
        administratorCount: 2,
      }),
    ).toMatch(/akun sendiri/);

    expect(
      roleChangeBlockReason({
        administratorId: "admin-1",
        targetUserId: "admin-2",
        currentRole: "ADMIN",
        nextRole: "STAFF",
        administratorCount: 1,
      }),
    ).toMatch(/Minimal satu administrator/);
  });

  it("allows safe role changes", () => {
    expect(
      roleChangeBlockReason({
        administratorId: "admin-1",
        targetUserId: "admin-2",
        currentRole: "ADMIN",
        nextRole: "STAFF",
        administratorCount: 2,
      }),
    ).toBeNull();
  });

  it("blocks unsafe deletion targets", () => {
    expect(
      deleteUserBlockReason({
        administratorId: "admin-1",
        targetUserId: "admin-1",
        targetRole: "ADMIN",
        administratorCount: 2,
        hasClinicalHistory: false,
      }),
    ).toMatch(/akun sendiri/);

    expect(
      deleteUserBlockReason({
        administratorId: "admin-1",
        targetUserId: "admin-2",
        targetRole: "ADMIN",
        administratorCount: 1,
        hasClinicalHistory: false,
      }),
    ).toMatch(/terakhir/);

    expect(
      deleteUserBlockReason({
        administratorId: "admin-1",
        targetUserId: "staff-1",
        targetRole: "STAFF",
        administratorCount: 1,
        hasClinicalHistory: true,
      }),
    ).toMatch(/riwayat klinis/);
  });

  it("allows deleting an unused account", () => {
    expect(
      deleteUserBlockReason({
        administratorId: "admin-1",
        targetUserId: "staff-1",
        targetRole: "STAFF",
        administratorCount: 1,
        hasClinicalHistory: false,
      }),
    ).toBeNull();
  });
});
