import { test, expect, type Page } from "@playwright/test";
import { createDeck, parseCards, seededRandom } from "../src/domain/cards";
import {
  applyAction,
  createSession,
  getLegalActions,
  startHand,
} from "../src/domain/play/engine";
import { DEFAULT_CONFIG, type Session } from "../src/domain/play/types";

function live(opponents = 3) {
  let s = createSession({ ...DEFAULT_CONFIG, opponents }, seededRandom(1), 0);
  s.dealer = opponents === 1 ? 0 : 1;
  s = startHand(s, seededRandom(11));
  for (
    let i = 0;
    s.actor !== "you" && s.status === "hand_in_progress" && i < 10;
    i++
  )
    s = applyAction(s, {
      playerId: s.actor!,
      type: getLegalActions(s, s.actor!).check ? "CHECK" : "CALL",
    });
  return s;
}
function fixtureDeck(prefix: string) {
  const first = parseCards(prefix);
  return [
    ...first,
    ...createDeck().filter((c) => !first.some((x) => x.id === c.id)),
  ];
}
function victory() {
  let s = createSession(
    { ...DEFAULT_CONFIG, opponents: 1 },
    seededRandom(1),
    0,
  );
  s.dealer = 1;
  s = startHand(
    s,
    undefined,
    fixtureDeck("As Ks Ah Kh Qc 2s 3d 7h Qd 8c Qh 9d"),
  );
  return applyAction(s, { type: "ALL_IN", playerId: "npc-1" });
}
function elimination() {
  let s = createSession(
    { ...DEFAULT_CONFIG, opponents: 2 },
    seededRandom(1),
    0,
  );
  s.dealer = 2;
  s = startHand(
    s,
    undefined,
    fixtureDeck("Ks As 2c Kh Ah 3c Qc 2s 3d 7h Qd 8c Qh 9d"),
  );
  s = applyAction(s, { type: "FOLD", playerId: "npc-2" });
  s = applyAction(s, { type: "ALL_IN", playerId: "you" });
  return applyAction(s, { type: "CALL", playerId: "npc-1" });
}
// Reach a real river decision through engine transitions. The human's call
// closes action, so settlement/Next hand do not depend on random NPC choices.
function riverDecision() {
  let s = createSession(DEFAULT_CONFIG, seededRandom(1), 0);
  s.dealer = 1;
  s = startHand(s, undefined, fixtureDeck(
    "2c 3c As 4c 5c 6c Ah 7c 8c 2s 3d 7h 9c 8d Tc 9d",
  ));
  s = applyAction(s, { type: "CALL", playerId: "you" });
  s = applyAction(s, { type: "FOLD", playerId: "npc-1" });
  while (s.street !== "river")
    s = applyAction(s, {
      type: getLegalActions(s, s.actor!).check ? "CHECK" : "CALL",
      playerId: s.actor!,
    });
  s = applyAction(s, { type: "BET", playerId: "npc-2", to: 10 });
  return applyAction(s, { type: "FOLD", playerId: "npc-3" });
}
async function seed(page: Page, session: Session, pacing = "instant") {
  await page.addInitScript(
    ({ session, pacing }) => {
      if (!localStorage.getItem("pokerlab.e2e.seeded")) {
        localStorage.setItem(
          "pokerlab.play.v2",
          JSON.stringify({ version: 2, session, pacing }),
        );
        localStorage.setItem("pokerlab.e2e.seeded", "1");
      }
    },
    { session, pacing },
  );
  await page.goto("/#play");
}
test.beforeEach(async ({ page }) => {
  page.on("pageerror", (error) => {
    throw error;
  });
});

test("new session defaults, real dealing and autonomous NPC actions", async ({
  page,
}) => {
  await page.goto("/#play");
  await expect(
    page.getByRole("heading", { name: "A seat at the table." }),
  ).toBeVisible();
  await expect(page.getByLabel("Play opponent count")).toHaveValue("3");
  await page.getByLabel("NPC pace").selectOption("instant");
  await page
    .getByRole("button", { name: "Start session", exact: true })
    .click();
  await expect(page.getByTestId("play-opponent")).toHaveCount(3);
  const controls = page.getByRole("region", { name: "Your available actions" });
  const result = page.getByRole("region", { name: "Hand result", exact: true });
  await expect(controls.or(result)).toBeVisible();
  if (await controls.isVisible())
    await controls.getByRole("button", { name: "Fold", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "Hand result", exact: true }),
  ).toBeVisible();
  const actions = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("pokerlab.play.v2")!).session.actions as
      { playerId: string; type: string }[],
  );
  expect(actions.some((a) => a.playerId !== "you" &&
    !["SMALL_BLIND", "BIG_BLIND", "REFUND"].includes(a.type))).toBe(true);
});

test("full board settlement, next hand and restored active state", async ({ page }) => {
  await seed(page, riverDecision());
  await expect(page.locator(".play-community .playing-card")).toHaveCount(5);
  await page.getByRole("button", { name: "Call 10", exact: true }).click();
  await expect(page.getByRole("region", { name: "Hand result", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Next hand", exact: true }).click();
  await expect(page.locator(".play-table-panel .table-topline")).toContainText(
    "002",
  );
  await expect(
    page.getByRole("region", { name: "Your available actions" }),
  ).toBeVisible();
  const cards = await page
    .locator('.play-human [role="img"]')
    .evaluateAll((nodes) => nodes.map((n) => n.getAttribute("aria-label")));
  await page.reload();
  await expect(
    page.getByRole("region", { name: "Your available actions" }),
  ).toBeVisible();
  expect(
    await page
      .locator('.play-human [role="img"]')
      .evaluateAll((nodes) => nodes.map((n) => n.getAttribute("aria-label"))),
  ).toEqual(cards);
  await expect(page.locator(".play-table-panel .table-topline")).toContainText(
    "002",
  );
});

test("integer raise validation, hidden information and persisted exact turn", async ({
  page,
}) => {
  await seed(page, live());
  await expect(
    page.getByTestId("play-opponent").getByRole("img", { name: "Hidden card" }),
  ).toHaveCount(6);
  const raise = page.getByLabel("Total commitment", { exact: true });
  await raise.fill("-1");
  await expect(page.getByRole("button", { name: /^Raise to/ })).toBeDisabled();
  await raise.fill("20");
  await page.getByRole("button", { name: "Raise to 20", exact: true }).click();
  await expect(
    page
      .getByRole("region", { name: "Your available actions" })
      .or(page.getByRole("region", { name: "Hand result", exact: true })),
  ).toBeVisible();
  await page.getByRole("button", { name: /Action history/ }).click();
  await expect(page.locator(".current-action-history")).toContainText(
    "raise 20 (to 20)",
  );
});

test("forced final all-in determines victory with conserved chips", async ({
  page,
}) => {
  await seed(page, victory());
  await page.getByRole("button", { name: /^Call / }).click();
  await expect(
    page.getByRole("heading", { name: "You win the session", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Session outcome" }),
  ).toContainText("All 2,000 virtual chips are accounted for.");
  await expect(
    page.getByRole("region", { name: "Your available actions" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "New session", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Start session", exact: true }),
  ).toBeVisible();
});

test("human elimination stops play without claiming an NPC tournament winner", async ({
  page,
}) => {
  await seed(page, elimination());
  await expect(
    page.getByRole("region", { name: "Session outcome" }),
  ).toContainText("You finished 3rd");
  await expect(page.getByText(/2 players remain/)).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Next hand", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "New session", exact: true }),
  ).toBeVisible();
});

test("corrupt Play save can be discarded without clearing Learn data", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem("pokerlab.play.v2", "broken");
  });
  await page.goto("/#play");
  await expect(page.getByRole("alert")).toContainText("could not be restored");
  await page.getByRole("button", { name: "Discard invalid Play save" }).click();
  await expect(
    page.getByRole("button", { name: "Start session", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Hand Trainer", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Check answer", exact: true }),
  ).toBeDisabled();
});
for (const width of [320, 390, 768, 1280, 1600])
  test(`Play fits ${width}px with five opponents and usable actions`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 900 });
    await seed(page, live(5), "relaxed");
    await expect(page.getByTestId("play-opponent")).toHaveCount(5);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    const controls = page.getByRole("region", {
      name: "Your available actions",
    });
    await expect(controls).toBeVisible();
    await controls.getByRole("button", { name: /^Call / }).click();
    await page.screenshot({
      path: info.outputPath(`play-${width}.png`),
      fullPage: true,
      animations: "disabled",
    });
  });
