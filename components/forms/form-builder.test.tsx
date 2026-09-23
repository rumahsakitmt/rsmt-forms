import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FormBuilder } from "@/components/forms/form-builder";
import { Toaster } from "@/components/ui/toast";

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

  function renderBuilder() {
    return render(
      <Toaster>
        <FormBuilder />
      </Toaster>,
    );
  }

  it("adds a draggable question block from the palette", async () => {
    const user = userEvent.setup();
    renderBuilder();

    await user.click(
      screen.getByRole("button", {
        name: "Seret atau klik untuk menambah Paragraf",
      }),
    );

    expect(await screen.findByText("Paragraf ditambahkan.")).toBeInTheDocument();
    expect(screen.getAllByText("Pertanyaan tanpa judul")).toHaveLength(2);
    expect(
      screen.getAllByRole("button", {
        name: "Seret untuk memindahkan pertanyaan Pertanyaan tanpa judul",
      }),
    ).toHaveLength(1);
  });

  it("previews choice fields with radio buttons and checkboxes", async () => {
    const user = userEvent.setup();
    renderBuilder();

    await user.click(
      screen.getAllByRole("button", {
        name: "Seret atau klik untuk menambah Pilihan tunggal",
      })[0],
    );
    await user.click(
      screen.getAllByRole("button", {
        name: "Seret atau klik untuk menambah Kotak centang",
      })[0],
    );

    expect(screen.getAllByRole("radio", { name: "Pilihan 1" })).toHaveLength(1);
    expect(screen.getAllByRole("checkbox", { name: "Pilihan 1" })).toHaveLength(1);

    await user.click(screen.getAllByRole("button", { name: "Pratinjau" })[0]);

    expect(screen.getAllByRole("radio", { name: "Pilihan 1" })).toHaveLength(1);
    expect(screen.getAllByRole("checkbox", { name: "Pilihan 1" })).toHaveLength(1);
  });
});
