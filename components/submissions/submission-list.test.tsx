import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { SubmissionList } from "@/components/submissions/submission-list";

const submission = {
  id: "submission-1",
  status: "SUBMITTED" as const,
  patientName: "Budi Santoso",
  medicalRecordNumber: "CM-001",
  room: "Mawar",
  updatedAt: new Date("2026-09-23T08:00:00.000Z"),
  createdBy: { id: "staff-1", name: "Perawat Sari" },
  formVersion: {
    version: 1,
    form: { id: "form-1", title: "Asesmen Awal", slug: "asesmen-awal" },
  },
};

const filters = { query: "" };

afterEach(cleanup);

describe("SubmissionList", () => {
  it.each([
    ["main", "/submissions/submission-1/print"],
    ["admin", "/admin/submissions/submission-1/print"],
  ] as const)("uses the %s print route", (context, expectedHref) => {
    render(
      <SubmissionList
        submissions={[submission]}
        forms={[]}
        filters={filters}
        context={context}
      />,
    );

    const printLink = screen.getByRole("link", {
      name: "Cetak formulir Budi Santoso",
    });

    expect(printLink).toHaveAttribute("href", expectedHref);
    expect(printLink).toHaveAttribute("target", "_blank");

    expect(
      screen.getByRole("link", { name: "Unduh PDF Budi Santoso" }),
    ).toHaveAttribute("href", `${expectedHref}?download=1`);
  });
});
