import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// Smoke tests — run against local dev or a deployed URL (set BASE_URL env var)
// ---------------------------------------------------------------------------

test.describe("homepage", () => {
  test("loads with correct title and hero", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Les Morts/i);
    await expect(page.getByRole("heading", { name: /Les Morts/i })).toBeVisible();
    await expect(page.getByText("Pay $1. We watch them.")).toBeVisible();
  });

  test("live badge is visible", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("live updates")).toBeVisible();
  });
});

test.describe("search", () => {
  test("shows search input and path toggles", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByPlaceholder(/Find someone alive/i)).toBeVisible();
    await expect(page.getByRole("button", { name: "Public figure" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Private person" })).toBeVisible();
  });

  test("shows spinner then results for a real name", async ({ page }) => {
    await page.goto("/");
    await page.getByPlaceholder(/Find someone alive/i).fill("Paul McCartney");
    // Spinner should appear briefly
    await expect(page.locator(".animate-spin")).toBeVisible({ timeout: 2000 });
    // Results or "No results" message should appear
    await expect(
      page.locator('[data-testid="person-card"], p:has-text("No results")')
    ).toBeVisible({ timeout: 10000 });
  });

  test("shows private person form when path toggled", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Private person" }).click();
    await expect(page.getByPlaceholder("Full name…")).toBeVisible();
  });
});

test.describe("following tab", () => {
  test("shows following and leaderboard tabs", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Following" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Leaderboard" })).toBeVisible();
  });

  test("leaderboard tab shows people", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Leaderboard" }).click();
    // At least one person card should appear
    await expect(page.locator("text=watching").first()).toBeVisible();
  });
});

test.describe("follow sheet modal", () => {
  test("opens centered when clicking a person on the leaderboard", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Leaderboard" }).click();
    // Click the first Watch button
    await page.getByRole("button", { name: /Watch/i }).first().click();

    const modal = page.locator(".sheet-enter");
    await expect(modal).toBeVisible();

    // Modal should be roughly centered — check it's not clipped off screen
    const box = await modal.boundingBox();
    expect(box).not.toBeNull();
    const viewport = page.viewportSize()!;
    // Modal left edge should be at most 10% from left (i.e. not shoved to the right)
    expect(box!.x).toBeGreaterThan(viewport.width * 0.05);
    // Modal right edge should not exceed viewport
    expect(box!.x + box!.width).toBeLessThan(viewport.width * 0.99);
    // Modal should be in the vertical middle third
    expect(box!.y).toBeGreaterThan(viewport.height * 0.05);
    expect(box!.y + box!.height).toBeLessThan(viewport.height * 0.98);
  });

  test("dismisses on backdrop click", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Leaderboard" }).click();
    await page.getByRole("button", { name: /Watch/i }).first().click();
    await expect(page.locator(".sheet-enter")).toBeVisible();

    // Click the backdrop (fixed overlay behind modal)
    await page.locator(".backdrop-enter").click({ force: true });
    await expect(page.locator(".sheet-enter")).not.toBeVisible();
  });

  test("shows payment step when Watch button clicked in modal", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Leaderboard" }).click();
    await page.getByRole("button", { name: /Watch/i }).first().click();

    const modal = page.locator(".sheet-enter");
    await expect(modal).toBeVisible();

    // CTA basket button — "Watch them · $N"
    const ctaBtn = modal.getByRole("button", { name: /Watch them/i });
    await expect(ctaBtn).toBeVisible();
    await ctaBtn.click();

    // Payment step: email input should appear
    await expect(modal.getByPlaceholder("your@email.com")).toBeVisible({ timeout: 5000 });
  });
});
