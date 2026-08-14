import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

type Route = { path: string; name: string };
const routes: Route[] = JSON.parse(readFileSync("e2e/routes.json", "utf8"));

for (const r of routes) {
  test(`route ${r.name} rend et se capture`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.goto(r.path);
    await expect(page.locator("#root")).not.toBeEmpty();
    await page.screenshot({ path: `e2e/shots/${r.name}-dark.png`, fullPage: true });
    expect(errors, `Erreurs JS sur ${r.path}`).toHaveLength(0);
  });
}

// Vues mobiles (contrat BUILD-022 — 5 vues responsive)
const MOBILE_ROUTES: Route[] = [
  { path: "/approvals", name: "approvals" },
  { path: "/blockers", name: "blockers" },
  { path: "/work", name: "work" },
  { path: "/", name: "home" },
  { path: "/settings", name: "settings" },
];

test.describe("vues mobiles", () => {
  test.use({ viewport: { width: 375, height: 812 } });
  for (const r of MOBILE_ROUTES) {
    test(`mobile ${r.name} rend et se capture`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(String(e)));
      await page.goto(r.path);
      await expect(page.locator("#root")).not.toBeEmpty();
      await page.screenshot({ path: `e2e/shots/${r.name}-mobile.png`, fullPage: true });
      expect(errors, `Erreurs JS sur ${r.path} (mobile)`).toHaveLength(0);
    });
  }
});
