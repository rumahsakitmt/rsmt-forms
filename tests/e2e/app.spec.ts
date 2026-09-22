import { expect, test } from "@playwright/test";

const adminEmail = process.env.E2E_ADMIN_EMAIL;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;

test.skip(!adminEmail || !adminPassword, "E2E administrator credentials are required.");

test("administrator can open the schema-driven assessment", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email dinas").fill(adminEmail!);
  await page.getByLabel("Kata sandi", { exact: true }).fill(adminPassword!);
  await page.getByRole("button", { name: "Masuk ke ruang kerja" }).click();

  await expect(page).toHaveURL("/");
  await expect(page.getByRole("heading", { name: "Pilih formulir untuk memulai." })).toBeVisible();
  await page.getByRole("link", { name: "Isi formulir" }).click();

  await expect(page.getByRole("heading", { name: /Assessment Kemampuan/ })).toBeVisible();
  await page.getByText("Ada hambatan", { exact: true }).click();
  await expect(page.getByLabel("Jelaskan hambatan keyakinan atau budaya")).toBeVisible();

  await page.getByText("Bahasa Indonesia", { exact: true }).first().click();
  await expect(page.getByRole("radio", { name: "Bahasa Indonesia: Aktif" })).toBeVisible();

  await page.getByRole("button", { name: /Kirim formulir/ }).click();
  await expect(page.getByText("Periksa kembali bagian yang belum lengkap.")).toBeVisible();
  await expect(page.locator(".field-error")).not.toHaveCount(0);
});

test("protected pages redirect signed-out visitors", async ({ page }) => {
  await page.goto("/submissions");
  await expect(page).toHaveURL(/\/login$/);
});
