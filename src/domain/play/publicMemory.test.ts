import { describe, expect, it, beforeEach } from "vitest";
import { seededRandom } from "../cards";
import { applyAction, createSession, getLegalActions, startHand, validateAction } from "./engine";
import { publicMemory, memoryAdjustment, validatePublicMemory, MEMORY_HANDS } from "./publicMemory";
import { observeNpc } from "./observation";
import { chooseNpcAction } from "./policy";
import { DEFAULT_CONFIG, type PublicAction } from "./types";
import { loadPublicMemory, savePublicMemory, V4_MEMORY_KEY, loadV4Settings, saveV4Settings } from "../../lib/v4Storage";
function complete() { let s = startHand(createSession(DEFAULT_CONFIG, seededRandom(2)), seededRandom(4)); while (s.status === "hand_in_progress") s = applyAction(s, { playerId: s.actor!, type: getLegalActions(s, s.actor!).check ? "CHECK" : "CALL" }); return s; }
beforeEach(() => localStorage.clear());
describe("bounded public-session memory", () => {
  it("retains only public actions, legitimate reveals and participation", () => {
    const s = complete(), m = publicMemory(s.id, s.handNumber, s.history, []);
    expect(m.completed[0].revealed).toEqual(s.history[0].revealed);
    expect(m.completed[0].participants).toHaveLength(4);
    const json = JSON.stringify(m); for (const c of [...s.deck, ...s.burns]) expect(json).not.toContain(`"${c.id}"`);
    expect(json).not.toContain("humanCards"); expect(json).not.toContain("replay"); expect(json).not.toContain("privateCards");
    m.completed[0].actions[0].added = 9000; expect(s.history[0].actions[0].added).not.toBe(9000);
  });
  it("bounds history/actions, persists and resets on a different session", () => {
    const s = complete(), history = Array.from({ length: 30 }, (_, i) => ({ ...s.history[0], number: i + 1 }));
    const m = publicMemory(s.id, 30, history, Array.from({ length: 100 }, () => s.actions[0]));
    expect(m.completed).toHaveLength(MEMORY_HANDS); expect(m.completed[0].number).toBe(19); expect(m.current).toHaveLength(64);
    expect(savePublicMemory(m)).toBeUndefined(); expect(loadPublicMemory(s.id)).toEqual(m); expect(loadPublicMemory("another")).toBeUndefined();
    savePublicMemory(null); expect(localStorage.getItem(V4_MEMORY_KEY)).toBeNull();
  });
  it("rejects corrupt/unsupported memory without touching the live session or Learn storage", () => {
    localStorage.setItem("pokerlab.v1", "keep");
    for (const value of [null, {}, { version: 2 }, { version: 1, completed: [] }]) { localStorage.setItem(V4_MEMORY_KEY, JSON.stringify(value)); expect(loadPublicMemory("x")).toBeUndefined(); expect(() => validatePublicMemory(value)).toThrow(); }
    expect(localStorage.getItem("pokerlab.v1")).toBe("keep");
    expect(loadV4Settings()).toEqual({ dialogue: true, replaySpeed: 1 });
    saveV4Settings({ dialogue: false, replaySpeed: 2 }); expect(loadV4Settings()).toEqual({ dialogue: false, replaySpeed: 2 });
  });
  it("uses bounded mature tendencies and retains legal reproducible policy decisions", () => {
    let s = createSession(DEFAULT_CONFIG, seededRandom(2)); s.dealer = 0; s = startHand(s, seededRandom(3));
    const o = observeNpc(s, s.actor!), m = publicMemory(s.id, 1, [], []);
    expect(memoryAdjustment(m, o.playerId, ["you"])).toBe(0);
    m.current = Array.from({ length: 20 }, (_, i): PublicAction => ({ playerId: "you", sequence: i + 1, street: "preflop", type: "RAISE", added: 20, total: 20 }));
    expect(memoryAdjustment(m, o.playerId, ["you"])).toBe(.035);
    for (let n = 0; n < 100; n++) {
      const a = chooseNpcAction(o, seededRandom(n), m);
      expect(a).toEqual(chooseNpcAction(o, seededRandom(n), m)); expect(validateAction(s, a)).toBeNull();
    }
    const clone = structuredClone(s); clone.deck.reverse(); [clone.players[0].cards[0], clone.deck[0]] = [clone.deck[0], clone.players[0].cards[0]];
    expect(chooseNpcAction(observeNpc(clone, clone.actor!), seededRandom(10), m)).toEqual(chooseNpcAction(o, seededRandom(10), m));
  });
});
it("handles unavailable storage and corrupt V4 settings without invalidating V2 saves", () => {
  const blocked = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); } } as unknown as Storage;
  expect(loadV4Settings(blocked)).toEqual({ dialogue: true, replaySpeed: 1 });
  expect(saveV4Settings({ dialogue: false, replaySpeed: 1 }, blocked)).toContain("could not be saved");
  expect(loadPublicMemory("x", blocked)).toBeUndefined();
  localStorage.setItem("pokerlab.v4.settings", '{"version":99,"dialogue":false}');
  expect(loadV4Settings()).toEqual({ dialogue: true, replaySpeed: 1 });
});
