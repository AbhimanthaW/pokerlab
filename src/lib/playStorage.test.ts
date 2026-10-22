import { beforeEach, describe, expect, it } from "vitest";
import { seededRandom } from "../domain/cards";
import { applyAction, createSession, startHand } from "../domain/play/engine";
import { assertSession } from "../domain/play/invariants";
import { DEFAULT_CONFIG } from "../domain/play/types";
import { PLAY_STORAGE_KEY, loadPlayData, savePlayData } from "./playStorage";
import { STORAGE_KEY } from "./storage";
beforeEach(() => localStorage.clear());
const live = () => {
  const s = createSession(DEFAULT_CONFIG, seededRandom(2), 0);
  s.dealer = 0;
  return startHand(s, seededRandom(7));
};
describe("independent Play schema and restoration", () => {
  it("loads empty defaults without touching Learn records", () => {
    localStorage.setItem(STORAGE_KEY, "learn sentinel");
    expect(loadPlayData()).toEqual({ session: null, pacing: "normal" });
    expect(localStorage.getItem(STORAGE_KEY)).toBe("learn sentinel");
  });
  it("restores the exact active hand, deck, actor and commitments", () => {
    let s = live();
    s = applyAction(s, { type: "RAISE", playerId: s.actor!, to: 50 });
    expect(savePlayData({ session: s, pacing: "relaxed" })).toBeUndefined();
    expect(loadPlayData()).toEqual({ session: s, pacing: "relaxed" });
    assertSession(loadPlayData().session);
  });
  it("restored revision rejects a duplicate command from before refresh", () => {
    const s = live();
    const next = applyAction(s, { type: "CALL", playerId: s.actor! });
    savePlayData({ session: next, pacing: "instant" });
    expect(() =>
      applyAction(
        loadPlayData().session!,
        { type: "CALL", playerId: next.actor! },
        s.revision,
      ),
    ).toThrow("Stale");
  });
  it.each([
    "{",
    "null",
    '{"version":1}',
    '{"version":999,"session":null,"pacing":"normal"}',
  ])("quarantines malformed or unsupported data: %s", (raw) => {
    localStorage.setItem(PLAY_STORAGE_KEY, raw);
    expect(loadPlayData().invalid).toBe(true);
    expect(localStorage.getItem(PLAY_STORAGE_KEY)).toBe(raw);
  });
  it("rejects changed chip supply, duplicate cards and impossible actors", () => {
    for (const mutate of [
      (s: ReturnType<typeof live>) => s.players[0].stack++,
      (s: ReturnType<typeof live>) => (s.deck[0] = s.players[0].cards[0]),
      (s: ReturnType<typeof live>) => (s.actor = "missing"),
    ]) {
      const s = live();
      mutate(s);
      localStorage.setItem(
        PLAY_STORAGE_KEY,
        JSON.stringify({ version: 2, session: s, pacing: "normal" }),
      );
      expect(loadPlayData().invalid).toBe(true);
    }
  });
  it("fails safely when storage access is denied", () => {
    const storage = {
      getItem() {
        throw Error("denied");
      },
      setItem() {
        throw Error("denied");
      },
    } as unknown as Storage;
    expect(loadPlayData(storage).invalid).toBe(true);
    expect(
      savePlayData({ session: live(), pacing: "normal" }, storage),
    ).toContain("denied");
  });
  it("restores settled hands and keeps detailed history bounded to 100", () => {
    let s = live();
    for (let i = 0; i < 105; i++) {
      while (s.status === "hand_in_progress")
        s = applyAction(s, { type: "FOLD", playerId: s.actor! });
      if (i < 104) s = startHand(s, seededRandom(i));
    }
    expect(s.history).toHaveLength(100);
    expect(savePlayData({ session: s, pacing: "normal" })).toBeUndefined();
    expect(loadPlayData().session).toEqual(s);
  });
  it("save validation reports errors instead of silently resetting", () => {
    const s = live();
    s.players[0].stack = -1;
    expect(savePlayData({ session: s, pacing: "normal" })).toContain(
      "Invalid session",
    );
    expect(localStorage.getItem(PLAY_STORAGE_KEY)).toBeNull();
  });
});

it("rejects a completed history whose awards disagree with actual stack changes", () => {
  let s = live();
  while (s.status === "hand_in_progress")
    s = applyAction(s, { type: "FOLD", playerId: s.actor! });
  const award = s.history[0].awards[0];
  award.amount++;
  award.payouts[award.winners[0]]++;
  localStorage.setItem(
    PLAY_STORAGE_KEY,
    JSON.stringify({ version: 2, session: s, pacing: "normal" }),
  );
  expect(loadPlayData().invalid).toBe(true);
});
