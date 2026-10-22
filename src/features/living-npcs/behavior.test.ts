import { expect, it } from "vitest";
import { characterPose, contextualLine, PRESENTATION_PROFILES, publicVariation } from "./behavior";
import type { Gesture } from "../immersive-play/presentation";
it("provides distinct deterministic personality movement independent of cards", () => {
  const outputs = Object.keys(PRESENTATION_PROFILES).map((p) => characterPose(p as keyof typeof PRESENTATION_PROFILES, "THINKING", 2, .4, true));
  expect(new Set(outputs.map((p) => JSON.stringify(p))).size).toBe(4);
  expect(publicVariation("public-session:1:npc-2")).toBe(publicVariation("public-session:1:npc-2"));
  expect(publicVariation("public-session:1:npc-2")).not.toBe(publicVariation("public-session:2:npc-2"));
});
it("handles every state, bounded one-shot gestures and reduced motion", () => {
  const gestures: Gesture[] = ["IDLE", "OBSERVING", "THINKING", "CHECKING", "CALLING", "RAISING", "FOLDING", "ALL_IN", "WAITING_FOR_SHOWDOWN", "SHOWDOWN", "HAND_COMPLETE", "ELIMINATED"];
  for (const g of gestures) { const p = characterPose("casual", g, .4, .5, true); expect(Object.values(p).filter((v) => typeof v === "number").every(Number.isFinite)).toBe(true); }
  expect(characterPose("aggressive", "RAISING", 10, .5, true).handZ).toBeCloseTo(0);
  expect(characterPose("casual", "THINKING", 1, .5, false)).toEqual(characterPose("casual", "THINKING", 9, .8, false));
  expect(characterPose("analytical", "ALL_IN", .4, .5, true).expression).toBe("surprised");
});
it("generates short context reactions from public session facts only", () => {
  const c = { hand: 1, status: "hand_in_progress", activePlayers: 4, name: "Alex", personality: "cautious" as const };
  expect(contextualLine(c)).toContain("everyone"); expect(contextualLine({ ...c, activePlayers: 2 })).toContain("two seats");
  expect(contextualLine({ ...c, status: "hand_complete" })).toContain("review");
});
