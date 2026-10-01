import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FormBuilder } from "@/components/forms/form-builder";
import { Toaster } from "@/components/ui/toast";

const { updateFormAction } = vi.hoisted(() => ({
  updateFormAction: vi.fn(async () => ({ success: true, message: "ok" })),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/app/actions/forms", () => ({
  createFormAction: vi.fn(),
  updateFormAction,
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

  it("publishes edits to an existing form as a new version", async () => {
    const user = userEvent.setup();
    render(
      <Toaster>
        <FormBuilder
          editing={{ formId: "form-1", version: 3 }}
          initial={{
            category: "Asesmen",
            schema: {
              schemaVersion: 1,
              title: "Asesmen nyeri",
              shortTitle: "Nyeri",
              description: "Skala nyeri pasien.",
              sections: [
                {
                  id: "s1",
                  title: "Nyeri",
                  fields: [
                    {
                      id: "painLevel",
                      type: "singleChoice",
                      label: "Tingkat nyeri",
                      options: [
                        { value: "ringan", label: "Ringan" },
                        { value: "berat", label: "Berat" },
                      ],
                    },
                  ],
                },
              ],
            },
          }}
        />
      </Toaster>,
    );

    expect(screen.getByText("Edit formulir · versi 3")).toBeInTheDocument();
    await user.click(screen.getAllByText("Tingkat nyeri")[0]);
    const option = screen.getByRole("textbox", { name: "Pilihan 1" });
    await user.clear(option);
    await user.type(option, "Nyeri ringan");
    await user.click(screen.getByRole("button", { name: /Terbitkan versi baru/ }));

    expect(updateFormAction).toHaveBeenCalledWith(
      expect.objectContaining({ formId: "form-1", baseVersion: 3 }),
    );
    const [{ schema }] = updateFormAction.mock.calls[0] as unknown as [
      { schema: { sections: { fields: { options: unknown[] }[] }[] } },
    ];
    expect(schema.sections[0].fields[0].options[0]).toEqual({
      value: "ringan",
      label: "Nyeri ringan",
    });
  });
});
