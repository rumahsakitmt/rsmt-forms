import { expect, test } from "@playwright/test";

const adminEmail = process.env.E2E_ADMIN_EMAIL;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;

test("administrator can open the schema-driven assessment", async ({
  page,
}) => {
  test.skip(
    !adminEmail || !adminPassword,
    "E2E administrator credentials are required.",
  );
  await page.goto("/login");
  await page.getByLabel("Email dinas").fill(adminEmail!);
  await page.getByLabel("Kata sandi", { exact: true }).fill(adminPassword!);
  await page.getByRole("button", { name: "Masuk ke ruang kerja" }).click();

  await expect(page).toHaveURL("/");
  await expect(
    page.getByRole("heading", { name: "Formulir klinis" }),
  ).toBeVisible();
  await expect(page.locator('[data-slot="sidebar"]')).toHaveCount(0);
  await page.getByRole("link", { name: "Isi formulir" }).first().click();

  await expect(
    page.getByRole("heading", { name: /Assessment Kemampuan/ }),
  ).toBeVisible();
  await page.getByText("Ada hambatan", { exact: true }).click();
  await expect(
    page.getByLabel("Jelaskan hambatan keyakinan atau budaya"),
  ).toBeVisible();

  await page.getByText("Bahasa Indonesia", { exact: true }).first().click();
  await expect(
    page.getByRole("radio", { name: "Bahasa Indonesia: Aktif" }),
  ).toBeVisible();

  await page.getByRole("button", { name: /Kirim formulir/ }).click();
  await expect(
    page.getByText("Periksa kembali bagian yang belum lengkap."),
  ).toBeVisible();
  await expect(page.locator('[data-slot="field-error"]')).not.toHaveCount(0);
});

test("protected pages redirect signed-out visitors", async ({ page }) => {
  for (const path of [
    "/",
    "/admin",
    "/admin/submissions",
    "/admin/account",
    "/admin/forms/new",
    "/admin/users",
    "/admin/submissions/test-id/print",
  ]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login$/);
  }
});

test("main submission routes do not redirect into admin", async ({
  request,
}) => {
  const response = await request.get("/submissions?q=example", {
    maxRedirects: 0,
  });
  expect(response.headers().location).toBe("/login");
  expect(response.headers().location).not.toContain("/admin/submissions");

  const account = await request.get("/account", { maxRedirects: 0 });
  expect(account.headers().location).toBe("/admin/account");
});

test("staff cannot open the admin area", async ({ page }) => {
  const email = process.env.E2E_STAFF_EMAIL;
  const password = process.env.E2E_STAFF_PASSWORD;
  test.skip(!email || !password, "E2E staff credentials are required.");
  await page.goto("/login");
  await page.getByLabel("Email dinas").fill(email!);
  await page.getByLabel("Kata sandi", { exact: true }).fill(password!);
  await page.getByRole("button", { name: "Masuk ke ruang kerja" }).click();
  await expect(page).toHaveURL("/");
  await expect(
    page.getByRole("link", { name: "Administrasi", exact: true }),
  ).toHaveCount(0);
  for (const path of [
    "/admin",
    "/admin/account",
    "/admin/submissions",
    "/admin/forms/new",
    "/admin/users",
    "/admin/submissions/test-id/print",
  ]) {
    await page.goto(path);
    await expect(page).toHaveURL("/");
  }
});
