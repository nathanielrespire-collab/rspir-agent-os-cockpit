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
