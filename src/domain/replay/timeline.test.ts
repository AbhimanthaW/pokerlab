import { describe, expect, it } from "vitest";
import { applyAction, createSession, getLegalActions, startHand } from "../play/engine";
import { DEFAULT_CONFIG } from "../play/types";
import { seededRandom } from "../cards";
import { buildReplay, replayMetadata, replaySnapshot } from "./timeline";
function completed(fold = false, seed = 8) {
  let s = startHand(createSession(DEFAULT_CONFIG, seededRandom(seed)), seededRandom(seed + 1));
  while (s.status === "hand_in_progress") s = applyAction(s, { playerId: s.actor!, type: fold ? "FOLD" : getLegalActions(s, s.actor!).check ? "CHECK" : "CALL" });
  return s;
}
describe("read-only replay", () => {
  it("orders blinds, deal, streets, showdown and distribution and conserves every snapshot", () => {
    const s = completed(), copy = structuredClone(s), record = buildReplay(s.history[0]);
    expect(record.events.slice(0, 4).map((e) => e.kind)).toEqual(["start", "action", "action", "deal"]);
    expect(record.events.filter((e) => e.kind === "board").map((e) => e.street)).toEqual(["flop", "turn", "river"]);
    const showdown = record.events.findIndex((e) => e.kind === "showdown");
    expect(showdown).toBeLessThan(record.events.findIndex((e) => e.kind === "award"));
    for (let i = 0; i < record.events.length; i++) {
      const snapshot = replaySnapshot(record, i);
      expect(snapshot.seats.reduce((n, p) => n + p.stack, snapshot.pot)).toBe(s.supply);
      expect(snapshot.seats.every((p) => p.stack >= 0)).toBe(true);
      if (i < showdown) expect(snapshot.seats.slice(1).every((p) => p.cards.every((c) => c === null))).toBe(true);
    }
    const final = replaySnapshot(record, record.events.length - 1);
    expect(final.seats.map((p) => p.stack)).toEqual(s.players.map((p) => p.stack));
    expect(final.pot).toBe(0); expect(s).toEqual(copy);
  });
  it("supports direct reverse seeking without future community or private information", () => {
    const record = buildReplay(completed().history[0]);
    const end = replaySnapshot(record, record.events.length - 1);
    expect(end.board).toHaveLength(5);
    const before = replaySnapshot(record, record.events.findIndex((e) => e.kind === "deal"));
    expect(before.board).toEqual([]); expect(before.seats[0].cards.every(Boolean)).toBe(true);
    expect(before.seats.slice(1).flatMap((p) => p.cards).every((c) => c === null)).toBe(true);
    before.seats[0].stack = 0;
    expect(replaySnapshot(record, record.events.findIndex((e) => e.kind === "deal")).seats[0].stack).toBeGreaterThan(0);
  });
  it("never reveals folded opponent hands or stores hidden deck metadata", () => {
    const s = completed(true), record = buildReplay(s.history[0]);
    expect(record.events.some((e) => e.kind === "showdown")).toBe(false);
    for (let i = 0; i < record.events.length; i++) expect(replaySnapshot(record, i).seats.slice(1).flatMap((p) => p.cards).every((c) => c === null)).toBe(true);
    const serialized = JSON.stringify(record);
    for (const card of [...s.deck, ...s.burns, ...s.players.slice(1).flatMap((p) => p.cards)]) expect(serialized).not.toContain(`"${card.id}"`);
  });
  it("supports historical records honestly and ignores corrupt optional metadata", () => {
    const h = completed().history[0]; delete h.replay;
    const legacy = buildReplay(h); expect(legacy.limited).toBe(true); expect(legacy.humanCards).toEqual([]);
    expect(replaySnapshot(legacy, legacy.events.length - 1).seats.map((p) => p.stack)).toEqual(h.finalStacks);
    const metadata = completed().history[0].replay!; metadata.humanCards = [metadata.humanCards[0], metadata.humanCards[0]];
    expect(replayMetadata({ ...h, replay: metadata })).toBeUndefined();
    expect(buildReplay({ ...h, replay: metadata }).limited).toBe(true);
  });
  it("reconstructs varied side pots, short stacks and refunds without recalculating winners", () => {
    for (let seed = 1; seed <= 80; seed++) {
      let s = createSession({ ...DEFAULT_CONFIG, opponents: 5 }, seededRandom(seed));
      const stacks = [5, 15, 100, 200, 1500, 4180]; s.players.forEach((p, i) => { p.stack = stacks[i]; });
      s = startHand(s, seededRandom(seed + 3));
      while (s.status === "hand_in_progress") s = applyAction(s, { playerId: s.actor!, type: getLegalActions(s, s.actor!).allIn ? "ALL_IN" : "CALL" });
      const r = buildReplay(s.history[0]);
      for (let i = 0; i < r.events.length; i++) expect(replaySnapshot(r, i).pot).toBeGreaterThanOrEqual(0);
      expect(replaySnapshot(r, r.events.length - 1).seats.map((p) => p.stack)).toEqual(s.history[0].finalStacks);
    }
  });
  it("rejects invalid seeks and inconsistent historical payouts", () => {
    const r = buildReplay(completed().history[0]);
    for (const n of [-1, .5, Infinity, r.events.length]) expect(() => replaySnapshot(r, n)).toThrow();
    r.hand.awards[0].payouts[r.hand.awards[0].winners[0]]++;
    expect(() => replaySnapshot(r, r.events.length - 1)).toThrow(/accounting/);
  });
});
it("allowlists optional metadata fields before they reach serialized replay or scene snapshots", () => {
  const s = completed(), h = s.history[0];
  Object.assign(h.replay!.participants[1], { privateCards: s.deck.slice(0, 2), deck: s.deck });
  Object.assign(h.replay!, { burnCards: s.burns }); Object.assign(h, { deck: s.deck });
  const record = buildReplay(h), serialized = JSON.stringify(record) + JSON.stringify(replaySnapshot(record, 0));
  expect(serialized).not.toContain("privateCards"); expect(serialized).not.toContain("burnCards"); expect(serialized).not.toContain('"deck"');
});
it("keeps valid V2 saves restorable when optional replay metadata is old, corrupt or absent", async () => {
  const { savePlayData, loadPlayData } = await import("../../lib/playStorage");
  const s = completed(), h = s.history[0];
  const original = structuredClone(h.replay!);
  for (const metadata of [undefined, { ...original, version: 99 }, { ...original, humanCards: [] }]) {
    h.replay = metadata as typeof h.replay;
    expect(savePlayData({ session: s, pacing: "normal" })).toBeUndefined();
    const loaded = loadPlayData(); expect(loaded.invalid).toBeUndefined(); expect(loaded.session?.history).toHaveLength(1);
    expect(buildReplay(loaded.session!.history[0]).limited).toBe(true);
  }
});
