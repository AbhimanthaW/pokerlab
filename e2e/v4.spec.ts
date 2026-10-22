import { expect, test, type Page } from "@playwright/test";
import { applyAction, createSession, getLegalActions, startHand } from "../src/domain/play/engine";
import { seededRandom } from "../src/domain/cards";
import { DEFAULT_CONFIG } from "../src/domain/play/types";
function completed() { let s = startHand(createSession(DEFAULT_CONFIG, seededRandom(9)), seededRandom(11)); while (s.status === "hand_in_progress") s = applyAction(s, { playerId: s.actor!, type: getLegalActions(s, s.actor!).check ? "CHECK" : "CALL" }); return s; }
async function seed(page: Page) {
  const session = completed();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(({ session }) => { if (!sessionStorage.getItem("v4-seeded")) { localStorage.setItem("pokerlab.play.v2", JSON.stringify({ version: 2, session, pacing: "relaxed" })); sessionStorage.setItem("v4-seeded", "1"); } }, { session });
  return session;
}
for (const [width, height] of [[1440, 900], [768, 1024], [390, 844], [320, 640]]) {
  test(`Probability Lab card selection and controls fit ${width}x${height}`, async ({ page }, info) => {
    await page.setViewportSize({ width, height }); await page.goto("/#probability");
    await expect(page.getByRole("heading", { name: "Probability Lab", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Select Ah", exact: true }).click(); await page.getByRole("button", { name: "Select Kh", exact: true }).click();
    await page.getByLabel("Card destination").selectOption("board");
    for (const c of ["Qh", "Jh", "2c"]) await page.getByRole("button", { name: `Select ${c}`, exact: true }).click();
    await expect(page.getByText("9 / 47", { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: info.outputPath(`v4-probability-${width}.png`), fullPage: true });
  });
}
test("real worker exact results, simulation comparison and cancellation", async ({ page }) => {
  await page.goto("/#probability");
  for (const c of ["Ah", "Kh"]) await page.getByRole("button", { name: `Select ${c}`, exact: true }).click();
  await page.getByLabel("Card destination").selectOption("board");
  for (const c of ["Qh", "Jh", "2c"]) await page.getByRole("button", { name: `Select ${c}`, exact: true }).click();
  await page.getByRole("button", { name: "Calculate exact distribution" }).click();
  await expect(page.getByRole("region", { name: "Probability results" })).toContainText("1,081 exact outcomes");
  await page.getByLabel("Simulation trials").fill("1000"); await page.getByRole("button", { name: "Run simulation" }).click();
  await expect(page.getByRole("region", { name: "Probability results" })).toContainText("1,000 simulated trials");
  await page.getByLabel("Simulation trials").fill("100000"); await page.getByRole("button", { name: "Run simulation" }).click();
  await page.getByRole("button", { name: "Cancel calculation" }).click();
  await expect(page.getByText("Calculation cancelled. Previous completed results are retained.")).toBeVisible();
});
for (const [width, height] of [[1440, 900], [390, 844]]) test(`read-only replay and safe live return ${width}x${height}`, async ({ page }, info) => {
  await page.setViewportSize({ width, height }); const session = await seed(page); await page.goto("/#play");
  await page.getByRole("button", { name: "Replay last hand" }).click();
  await expect(page.getByText("REPLAY MODE · READ ONLY")).toBeVisible();
  await page.getByRole("button", { name: "Next event", exact: true }).click();
  await page.getByRole("button", { name: "Previous event", exact: true }).click();
  await page.getByLabel("Replay timeline").fill("4"); await page.getByLabel("Replay speed").selectOption("2");
  await page.getByRole("button", { name: "Play replay", exact: true }).click(); await page.getByRole("button", { name: "Pause replay", exact: true }).click();
  await page.screenshot({ path: info.outputPath(`v4-replay-${width}.png`), animations: "disabled" });
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("pokerlab.play.v2")!).session)).toEqual(session);
  await page.getByRole("button", { name: "Return to live Play", exact: true }).click();
  await page.getByRole("button", { name: "Pause and settings" }).click();
  await page.getByLabel("Character dialogue").uncheck(); await page.getByRole("button", { name: "Resume", exact: true }).click();
  await expect(page.locator(".npc-dialogue")).toHaveCount(0);
  await page.reload(); expect(await page.evaluate(() => JSON.parse(localStorage.getItem("pokerlab.play.v2")!).session)).toEqual(session);
});
