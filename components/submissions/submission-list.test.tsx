import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/app/actions/submissions", () => ({
  deleteSubmissionAction: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

import { SubmissionList } from "@/components/submissions/submission-list";
import { deleteSubmissionAction } from "@/app/actions/submissions";

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

  it.each([
    ["main", "/forms/asesmen-awal/new?draft=submission-1"],
    ["admin", "/admin/submissions/submission-1/edit"],
  ] as const)("links submitted records to the %s editor", (context, href) => {
    render(
      <SubmissionList
        submissions={[submission]}
        forms={[]}
        filters={filters}
        context={context}
      />,
    );

    expect(
      screen.getByRole("link", { name: "Edit formulir Budi Santoso" }),
    ).toHaveAttribute("href", href);
  });

  it("asks for confirmation before deleting a submission", async () => {
    const user = userEvent.setup();
    render(
      <SubmissionList
        submissions={[submission]}
        forms={[]}
        filters={filters}
        context="main"
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Hapus formulir Budi Santoso" }),
    );

    expect(
      screen.getByRole("heading", { name: "Hapus formulir Budi Santoso?" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/seluruh jawabannya akan dihapus permanen/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Hapus permanen" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Batal" })).toBeInTheDocument();

    vi.mocked(deleteSubmissionAction).mockResolvedValueOnce({
      success: false,
      message: "Penghapusan ditolak.",
    });
    await user.click(screen.getByRole("button", { name: "Hapus permanen" }));

    await waitFor(() =>
      expect(deleteSubmissionAction).toHaveBeenCalledWith("submission-1"),
    );
    expect(screen.getByText("Penghapusan ditolak.")).toBeInTheDocument();
  });
});
