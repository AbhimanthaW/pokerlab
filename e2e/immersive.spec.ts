import { expect, test, type Page } from "@playwright/test";
import { createSession, startHand } from "../src/domain/play/engine";
import { seededRandom } from "../src/domain/cards";
import { DEFAULT_CONFIG, type Session } from "../src/domain/play/types";
import { scenario } from "../qa/fixtures";

function live() { const s = createSession(DEFAULT_CONFIG, seededRandom(11)); s.dealer = 1; return startHand(s, seededRandom(13)); }
async function seed(page: Page, session: Session = live()) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(({ session }) => {
    if (!sessionStorage.getItem("v3-fixture")) {
      localStorage.setItem("pokerlab.play.v2", JSON.stringify({ version: 2, session, pacing: "normal" }));
      sessionStorage.setItem("v3-fixture", "1");
    }
  }, { session });
  await page.goto("/#play");
}
for (const [width, height] of [[1920, 1080], [1440, 900], [1280, 800], [768, 1024], [390, 844], [320, 640]])
  test(`real 3D scene and action panel fit ${width}x${height}`, async ({ page }, info) => {
    await page.setViewportSize({ width, height }); await seed(page);
    await expect(page.locator("canvas")).toBeVisible();
    await expect(page.locator(".npc-label")).toHaveCount(3);
    await expect(page.locator(".sidebar")).toHaveCount(0);
    const controls = page.getByRole("region", { name: "Your available actions" });
    await expect(controls).toBeVisible();
    const box = await controls.boundingBox();
    expect(box).not.toBeNull(); expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.y).toBeGreaterThanOrEqual(0); expect(box!.x + box!.width).toBeLessThanOrEqual(width);
    expect(box!.y + box!.height).toBeLessThanOrEqual(height);
    await expect(page.locator(".community-readout")).not.toBeVisible();
    await page.getByText("Table details", { exact: true }).click();
    await expect(page.getByRole("list", { name: "Opponent stacks" })).toBeVisible();
    await page.getByText("Table details", { exact: true }).click();
    const stack = await page.locator(".human-stack").boundingBox();
    const overlap = stack && Math.min(stack.x + stack.width, box!.x + box!.width) > Math.max(stack.x, box!.x)
      && Math.min(stack.y + stack.height, box!.y + box!.height) > Math.max(stack.y, box!.y);
    expect(overlap).toBe(false);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: info.outputPath(`immersive-${width}x${height}.png`), animations: "disabled" });
  });
test("display switching, Learn return and refresh preserve the exact active hand", async ({ page }) => {
  const s = live(); await seed(page, s); await expect(page.locator("canvas")).toBeVisible();
  await page.getByRole("button", { name: "Pause and settings" }).click();
  await page.getByLabel("Table display").selectOption("2d");
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await expect(page.getByRole("button", { name: "Call 10", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Try 3D" }).click();
  await expect(page.locator("canvas")).toBeVisible(); await page.reload();
  await expect(page.locator("canvas")).toBeVisible();
  const restored = await page.evaluate(() => JSON.parse(localStorage.getItem("pokerlab.play.v2")!).session);
  expect(restored).toEqual(s);
  await page.getByRole("button", { name: "Pause and settings" }).click();
  await page.getByRole("button", { name: "Return to Learn", exact: true }).click();
  await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeVisible();
});
test("context loss automatically switches to playable 2D without losing chips or cards", async ({ page }) => {
  const s = live(); await seed(page, s); await expect(page.locator("canvas")).toBeVisible();
  await page.locator("canvas").evaluate((canvas) => canvas.dispatchEvent(new Event("webglcontextlost", { cancelable: true })));
  await expect(page.getByRole("button", { name: "Call 10", exact: true })).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("pokerlab.play.v2")!).session)).toEqual(s);
});
test("fullscreen rejection keeps viewport Play and the same hand", async ({ page }) => {
  await page.addInitScript(() => { HTMLElement.prototype.requestFullscreen = () => Promise.reject(new Error("fixture denied")); });
  const s = live(); await seed(page, s);
  await page.getByRole("button", { name: "Enter fullscreen", exact: true }).click();
  await expect(page.getByText(/Fullscreen was declined/)).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("pokerlab.play.v2")!).session)).toEqual(s);
});
test("final all-in settles a complete session in the immersive HUD", async ({ page }) => {
  await seed(page, scenario("victory"));
  await page.getByRole("button", { name: /^Call / }).click();
  await expect(page.getByRole("heading", { name: "You win the session", exact: true })).toBeVisible();
  await expect(page.getByRole("region", { name: "Session outcome" })).toContainText("All 2,000 virtual chips are accounted for.");
  await expect(page.getByRole("region", { name: "Your available actions" })).toHaveCount(0);
});
test("human elimination is distinct from a completed NPC tournament", async ({ page }) => {
  await seed(page, scenario("eliminated"));
  await expect(page.getByRole("region", { name: "Session outcome" })).toContainText("2 players remain");
  await expect(page.getByRole("button", { name: "New session", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Next hand", exact: true })).toHaveCount(0);
});
test("compact raise editor cancels without action and confirms a legal total", async ({ page }) => {
  const s = live(); await seed(page, s);
  await expect(page.getByLabel("Total commitment", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Raise", exact: true }).click();
  await expect(page.getByLabel("Total commitment", { exact: true })).toBeFocused();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("pokerlab.play.v2")!).session)).toEqual(s);
  await page.getByRole("button", { name: "Raise", exact: true }).click();
  await page.getByLabel("Total commitment", { exact: true }).fill("35");
  await page.getByRole("button", { name: "Confirm raise to 35", exact: true }).click();
  await expect.poll(async () => (await page.evaluate(() => JSON.parse(localStorage.getItem("pokerlab.play.v2")!).session)).actions.some((a: { playerId: string; type: string; total: number }) => a.playerId === "you" && a.type === "RAISE" && a.total === 35)).toBe(true);
});
