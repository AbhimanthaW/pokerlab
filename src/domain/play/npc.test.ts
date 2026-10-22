import { describe, expect, it } from "vitest";
import { seededRandom } from "../cards";
import {
  applyAction,
  createSession,
  startHand,
  validateAction,
} from "./engine";
import { observeNpc } from "./observation";
import { chooseNpcAction, safeNpcAction } from "./policy";
import { DEFAULT_CONFIG } from "./types";

describe("NPC information boundary and legal decisions", () => {
  it("passes only a detached deeply frozen allowlist to NPC policy", () => {
    let s = createSession(DEFAULT_CONFIG, seededRandom(2), 0);
    s.dealer = 0;
    s = startHand(s, seededRandom(7));
    const o = observeNpc(s, s.actor!);
    expect(Object.keys(o).sort()).toEqual(
      [
        "playerId",
        "privateCards",
        "board",
        "stack",
        "participants",
        "pot",
        "dealer",
        "smallBlind",
        "bigBlind",
        "bigBlindAmount",
        "street",
        "actions",
        "legal",
        "personality",
        "difficulty",
      ].sort(),
    );
    expect(Object.keys(o.participants[0]).sort()).toEqual(
      [
        "id",
        "stack",
        "contribution",
        "streetChips",
        "folded",
        "inHand",
        "seat",
      ].sort(),
    );
    expect(JSON.stringify(o)).not.toContain(s.players[0].cards[0].id);
    expect(Object.isFrozen(o.privateCards[0])).toBe(true);
    expect(() => {
      (o.privateCards as unknown as { rank: number }[])[0].rank = 2;
    }).toThrow();
    expect(s.players.find((p) => p.id === o.playerId)!.cards).toEqual(
      o.privateCards,
    );
    expect(() => observeNpc(s, "you")).toThrow();
  });
  it("does not react to changed inaccessible cards or deck order", () => {
    let s = createSession(DEFAULT_CONFIG, seededRandom(2), 0);
    s.dealer = 0;
    s = startHand(s, seededRandom(7));
    const before = observeNpc(s, s.actor!);
    const clone = structuredClone(s);
    [clone.players[0].cards[0], clone.deck[0]] = [
      clone.deck[0],
      clone.players[0].cards[0],
    ];
    clone.deck.reverse();
    clone.burns = clone.deck.slice(0, 1);
    expect(observeNpc(clone, clone.actor!)).toEqual(before);
    expect(chooseNpcAction(before, seededRandom(10))).toEqual(
      chooseNpcAction(observeNpc(clone, clone.actor!), seededRandom(10)),
    );
  });
  it.each(["beginner", "standard", "challenge"] as const)(
    "all personalities take legal reproducible actions at %s",
    (difficulty) => {
      const random = seededRandom(91);
      for (let seed = 1; seed <= 60; seed++) {
        let s = startHand(
          createSession(
            { ...DEFAULT_CONFIG, opponents: 5, difficulty },
            random,
            0,
          ),
          random,
        );
        for (
          let step = 0;
          s.status === "hand_in_progress" && step < 300;
          step++
        ) {
          if (s.actor === "you") {
            s = applyAction(s, { type: "FOLD", playerId: "you" });
            continue;
          }
          const o = observeNpc(s, s.actor!);
          const a = chooseNpcAction(o, seededRandom(step + seed));
          expect(a).toEqual(chooseNpcAction(o, seededRandom(step + seed)));
          expect(validateAction(s, a)).toBeNull();
          s = applyAction(s, a);
        }
      }
    },
  );
  it("personalities have measurably different aggression over identical observations", () => {
    let s = createSession(DEFAULT_CONFIG, seededRandom(2));
    s.dealer = 0;
    s = startHand(s, seededRandom(7));
    const obs = observeNpc(s, s.actor!);
    const counts = { cautious: 0, aggressive: 0, casual: 0, analytical: 0 };
    for (const personality of Object.keys(counts) as (keyof typeof counts)[])
      for (let i = 0; i < 1000; i++) {
        const a = chooseNpcAction({ ...obs, personality }, seededRandom(i));
        if (["RAISE", "BET", "ALL_IN"].includes(a.type)) counts[personality]++;
      }
    expect(counts.aggressive).toBeGreaterThan(counts.cautious * 1.8);
    expect(new Set(Object.values(counts)).size).toBe(4);
  });
  it("falls back safely for malformed, illegal, oversized or wrong-player outputs", () => {
    let s = createSession(DEFAULT_CONFIG, seededRandom(2));
    s.dealer = 0;
    s = startHand(s, seededRandom(7));
    const o = observeNpc(s, s.actor!);
    for (const invalid of [
      null,
      {},
      NaN,
      { type: "CHECK", playerId: s.actor },
      { type: "RAISE", playerId: s.actor, to: 1e9 },
      { type: "FOLD", playerId: "you" },
    ])
      expect(validateAction(s, safeNpcAction(o, invalid))).toBeNull();
    expect(
      validateAction(
        s,
        chooseNpcAction(o, () => NaN),
      ),
    ).toBeNull();
  });
});
