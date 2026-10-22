import { test, expect, type Page } from "@playwright/test";

const errors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const list: string[] = [];
  errors.set(page, list);
  page.on("pageerror", (error) => list.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") list.push(message.text());
  });
  await page.goto("/");
});
test.afterEach(async ({ page }) => {
  expect(errors.get(page) ?? [], "browser errors").toEqual([]);
});
const nav = (page: Page, name: string) =>
  page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name, exact: true });
const table = (page: Page) =>
  page.getByRole("region", { name: "Texas Hold'em practice table" });
async function noOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
    "page fits viewport",
  ).toBe(true);
}

test("complete local hand, exercise, prediction, reveal, review and next hand", async ({
  page,
}, info) => {
  await expect(
    page.getByRole("button", { name: "Start hand", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Start hand", exact: true }).click();
  await expect(table(page).locator('.your-cards [role="img"]')).toHaveCount(2);
  await expect(
    page.getByTestId("opponent-seat").getByRole("img", { name: "Hidden card" }),
  ).toHaveCount(4);
  await expect(
    table(page).locator(".community-cards .playing-card"),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Reveal flop", exact: true }).click();
  await expect(
    table(page).locator(".community-cards .playing-card"),
  ).toHaveCount(3);
  await page.getByRole("button", { name: "High Card", exact: false }).click();
  await expect(page.locator('.exercise-panel [role="status"]')).toContainText(
    /Nicely read|A chance to learn/,
  );
  await page.getByRole("button", { name: "Reveal turn", exact: true }).click();
  await expect(
    table(page).locator(".community-cards .playing-card"),
  ).toHaveCount(4);
  await page.getByRole("button", { name: "Reveal river", exact: true }).click();
  await expect(
    table(page).locator(".community-cards .playing-card"),
  ).toHaveCount(5);
  await expect(
    page.getByTestId("opponent-seat").getByRole("img", { name: "Hidden card" }),
  ).toHaveCount(4);
  await page
    .getByLabel("Predict the showdown", { exact: true })
    .selectOption("you");
  await page
    .getByRole("button", { name: "Reveal showdown", exact: true })
    .click();
  await expect(
    page.getByTestId("opponent-seat").getByRole("img", { name: "Hidden card" }),
  ).toHaveCount(0);
  await expect(
    page.getByTestId("opponent-seat").locator(".playing-card"),
  ).toHaveCount(4);
  await expect(page.locator(".result-banner")).toContainText(/win|tie/);
  await expect(page.locator(".player-result")).toHaveCount(3);
  await page.screenshot({
    path: info.outputPath("desktop-showdown.png"),
    fullPage: true,
    animations: "disabled",
  });
  await page.getByRole("button", { name: "Review hand", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Your learning this hand" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Next hand", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Reveal flop", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByTestId("opponent-seat").getByRole("img", { name: "Hidden card" }),
  ).toHaveCount(4);
  await nav(page, "Progress").click();
  await expect(
    page
      .locator(".stat-card")
      .filter({ hasText: "COMPLETED" })
      .locator("strong"),
  ).toHaveText("2");
  await expect(
    page.locator(".stat-card").filter({ hasText: "SKIPPED" }).locator("strong"),
  ).toHaveText("5");
  await page.reload();
  await expect(
    page
      .locator(".stat-card")
      .filter({ hasText: "COMPLETED" })
      .locator("strong"),
  ).toHaveText("2");
  await expect(
    page.locator(".stat-card").filter({ hasText: "SKIPPED" }).locator("strong"),
  ).toHaveText("5");
});

test("trainer recognition, best-five selection grading and comparison are functional", async ({
  page,
}) => {
  await nav(page, "Hand Trainer").click();
  await page.getByRole("button", { name: "High Card", exact: true }).click();
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  await expect(page.locator('.trainer-panel [role="status"]')).toContainText(
    /Well read|A learning moment/,
  );
  await page
    .getByRole("button", { name: "Next exercise", exact: false })
    .click();
  await page
    .getByRole("button", { name: "Skip exercise", exact: false })
    .click();
  await expect(page.locator('.trainer-panel [role="status"]')).toContainText(
    "Exercise skipped",
  );
  await page.getByRole("button", { name: "Best five", exact: true }).click();
  const cards = page.locator(".trainer-panel > .card-row button");
  await expect(cards).toHaveCount(7);
  for (let i = 0; i < 5; i++) await cards.nth(i).click();
  await expect(
    page.getByRole("button", { name: "Check answer", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  await expect(page.locator('.trainer-panel [role="status"]')).toContainText(
    "One optimal five-card hand",
  );
  await page
    .getByRole("button", { name: "Hand comparison", exact: true })
    .click();
  await page.getByRole("button", { name: "Exact tie", exact: true }).click();
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  await expect(page.locator('.trainer-panel [role="status"]')).toContainText(
    /Well read|A learning moment/,
  );
  await nav(page, "Progress").click();
  await expect(
    page
      .locator(".stat-card")
      .filter({ hasText: "COMPLETED" })
      .locator("strong"),
  ).toHaveText("3");
  await expect(
    page.locator(".stat-card").filter({ hasText: "SKIPPED" }).locator("strong"),
  ).toHaveText("1");
});

test("settings persist and progress reset preserves preferences", async ({
  page,
}) => {
  await nav(page, "Hand Trainer").click();
  await page
    .getByRole("button", { name: "Skip exercise", exact: false })
    .click();
  await nav(page, "Settings").click();
  await page
    .getByLabel("Number of opponents", { exact: true })
    .selectOption("5");
  await page
    .getByLabel("Exercise difficulty", { exact: false })
    .selectOption("challenge");
  await page.getByLabel("Reduce motion", { exact: false }).check();
  await page.getByLabel("Four-color suits", { exact: false }).check();
  await page.reload();
  await expect(
    page.getByLabel("Number of opponents", { exact: true }),
  ).toHaveValue("5");
  await expect(
    page.getByLabel("Exercise difficulty", { exact: false }),
  ).toHaveValue("challenge");
  await expect(
    page.getByLabel("Reduce motion", { exact: false }),
  ).toBeChecked();
  await page
    .getByRole("button", { name: "Reset learning progress", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Keep my progress", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Reset learning progress", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Yes, reset progress", exact: true })
    .click();
  await nav(page, "Progress").click();
  await expect(
    page.locator(".stat-card").filter({ hasText: "SKIPPED" }).locator("strong"),
  ).toHaveText("0");
  await nav(page, "Practice Table").click();
  await page.getByRole("button", { name: "Start hand", exact: true }).click();
  await expect(page.getByTestId("opponent-seat")).toHaveCount(5);
});

for (const width of [320, 390, 768]) {
  test(`responsive ${width}px table, trainer and rankings fit`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 900 });
    await noOverflow(page);
    await nav(page, "Settings").click();
    await page
      .getByLabel("Number of opponents", { exact: true })
      .selectOption("5");
    await nav(page, "Practice Table").click();
    await page.getByRole("button", { name: "Start hand", exact: true }).click();
    await expect(page.getByTestId("opponent-seat")).toHaveCount(5);
    await page
      .getByRole("button", { name: "Reveal flop", exact: true })
      .click();
    await expect(page.locator(".community-cards .playing-card")).toHaveCount(3);
    await noOverflow(page);
    await page.screenshot({
      path: info.outputPath(`table-${width}.png`),
      fullPage: true,
      animations: "disabled",
    });
    await nav(page, "Hand Trainer").click();
    await page.getByRole("button", { name: "Best five", exact: true }).click();
    await expect(page.locator(".trainer-panel > .card-row button")).toHaveCount(
      7,
    );
    await noOverflow(page);
    await page.screenshot({
      path: info.outputPath(`trainer-${width}.png`),
      fullPage: true,
      animations: "disabled",
    });
    await nav(page, "Hand Rankings").click();
    await expect(page.locator(".reference-item")).toHaveCount(9);
    await noOverflow(page);
  });
}
