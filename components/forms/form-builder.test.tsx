import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FormBuilder } from "@/components/forms/form-builder";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/app/actions/forms", () => ({
  createFormAction: vi.fn(),
}));

describe("FormBuilder", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockImplementation(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );
  });

  it("adds a draggable question block from the palette", async () => {
    const user = userEvent.setup();
    render(<FormBuilder />);

    await user.click(
      screen.getByRole("button", {
        name: "Seret atau klik untuk menambah Paragraf",
      }),
    );

    expect(screen.getByText("Paragraf ditambahkan.")).toBeInTheDocument();
    expect(screen.getAllByText("Pertanyaan tanpa judul")).toHaveLength(2);
    expect(
      screen.getAllByRole("button", {
        name: "Seret untuk memindahkan pertanyaan Pertanyaan tanpa judul",
      }),
    ).toHaveLength(1);
  });
});
