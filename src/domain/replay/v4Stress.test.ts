import { expect, it } from "vitest";
import { seededRandom } from "../cards";
import { applyAction, createSession, getLegalActions, startHand } from "../play/engine";
import { assertSession } from "../play/invariants";
import { observeNpc } from "../play/observation";
import { chooseNpcAction } from "../play/policy";
import { publicMemory } from "../play/publicMemory";
import { DEFAULT_CONFIG, type Session } from "../play/types";
import { buildReplay, replaySnapshot } from "./timeline";
it("runs 600 memory-aware hands and reconstructs every replay event with conserved chips", () => {
  const random = seededRandom(7412); let s: Session | undefined, transitions = 0, snapshots = 0, sessions = 0;
  for (let hand = 0; hand < 600; hand++) {
    if (!s || hand % 12 === 0 || ["player_eliminated", "session_complete"].includes(s.status)) { s = createSession({ ...DEFAULT_CONFIG, opponents: 1 + hand % 5 }, random); sessions++; }
    s = startHand(s, random); assertSession(s); let actions = 0;
    while (s.status === "hand_in_progress") {
      if (++actions > 1000) throw new Error(`Deadlock in seed 7412, hand ${hand}`);
      const legal = getLegalActions(s, s.actor!);
      const action = s.actor === "you" ? { playerId: "you", type: legal.check ? "CHECK" as const : "CALL" as const } : chooseNpcAction(observeNpc(s, s.actor!), random, publicMemory(s.id, s.handNumber, s.history, s.actions));
      s = applyAction(s, action); assertSession(s); transitions++;
    }
    const r = buildReplay(s.history.at(-1)!);
    for (let i = 0; i < r.events.length; i++) {
      const p = replaySnapshot(r, i); snapshots++;
      expect(p.seats.reduce((n, p) => n + p.stack, p.pot)).toBe(s.supply);
      expect(p.seats.every((p) => p.stack >= 0)).toBe(true);
    }
  }
  expect(transitions).toBeGreaterThan(1000); expect(snapshots).toBeGreaterThan(transitions);
  console.info(JSON.stringify({ v4Seed: 7412, hands: 600, sessions, transitions, replaySnapshots: snapshots }));
}, 30000);
