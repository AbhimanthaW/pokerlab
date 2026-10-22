import { describe, expect, it } from "vitest";
import { createDeck, parseCards, seededRandom, shuffle } from "../cards";
import {
  applyAction,
  createSession,
  getLegalActions,
  getPlayView,
  startHand,
  validateAction,
} from "./engine";
import { assertSession } from "./invariants";
import { buildPots, resolvePots } from "./pots";
import { DEFAULT_CONFIG, type Action, type Session } from "./types";

function game(opponents = 3, stacks?: number[]) {
  let s = createSession({ ...DEFAULT_CONFIG, opponents }, seededRandom(1), 0);
  s.dealer = 0;
  if (stacks) {
    const sum = stacks.reduce((a, b) => a + b, 0);
    s.players.forEach((p, i) => (p.stack = stacks[i]));
    s.players[0].stack += s.supply - sum;
  }
  s = startHand(s, seededRandom(2));
  assertSession(s);
  return s;
}
function act(s: Session, type: Action["type"], to?: number) {
  return applyAction(s, {
    type,
    playerId: s.actor!,
    ...(type === "BET" || type === "RAISE" ? { to: to! } : {}),
  } as Action);
}
function callThrough(s: Session) {
  let n = 0;
  while (s.status === "hand_in_progress") {
    const l = getLegalActions(s, s.actor!);
    s = act(s, l.check ? "CHECK" : "CALL");
    assertSession(s);
    if (++n > 100) throw Error("loop");
  }
  return s;
}
function contender(
  id: string,
  committed: number,
  cards: string,
  folded = false,
) {
  return { id, committed, cards: parseCards(cards), folded };
}

describe("positions, dealing and lifecycle", () => {
  it("defaults to equal stacks, fixed blinds and a nonconstant fair button", () => {
    const buttons = new Set(
      Array.from(
        { length: 50 },
        (_, i) => createSession(DEFAULT_CONFIG, seededRandom(i)).dealer,
      ),
    );
    expect(buttons.size).toBe(4);
    const s = createSession();
    expect(s.players.map((p) => p.stack)).toEqual([1000, 1000, 1000, 1000]);
    assertSession(s);
  });
  it.each([1, 2, 3, 4, 5])(
    "deals two clockwise private cards to %i NPCs and preserves 52 unique cards",
    (n) => {
      const s = game(n);
      expect(s.players.every((p) => p.cards.length === 2)).toBe(true);
      expect(s.deck.length).toBe(52 - 2 * (n + 1));
      assertSession(s);
    },
  );
  it("posts blinds and starts after BB multiway", () => {
    const s = game();
    expect([s.smallBlindSeat, s.bigBlindSeat, s.actor]).toEqual([
      1,
      2,
      "npc-3",
    ]);
    expect(s.players.map((p) => p.committed)).toEqual([0, 5, 10, 0]);
  });
  it("deals first card left of dealer and last to dealer each pass", () => {
    const s = game();
    const deck = shuffle(createDeck(), seededRandom(2));
    expect(s.players[1].cards).toEqual([deck[0], deck[4]]);
    expect(s.players[0].cards).toEqual([deck[3], deck[7]]);
  });
  it("heads-up dealer is SB, acts first preflop, BB first postflop", () => {
    let s = game(1);
    expect([s.smallBlindSeat, s.bigBlindSeat, s.actor]).toEqual([0, 1, "you"]);
    s = act(s, "CALL");
    s = act(s, "CHECK");
    expect([s.street, s.actor]).toEqual(["flop", "npc-1"]);
  });
  it("preserves the big blind option after calls", () => {
    let s = game();
    for (let i = 0; i < 3; i++) s = act(s, "CALL");
    expect(s.actor).toBe("npc-2");
    expect(getLegalActions(s, s.actor!).check).toBe(true);
    expect(s.street).toBe("preflop");
  });
  it("burns exactly one before each community street and rotates a fresh hand", () => {
    const original = game();
    let s = original;
    for (let i = 0; i < 4; i++) s = act(s, i === 3 ? "CHECK" : "CALL");
    expect([s.board.length, s.burns.length, s.street]).toEqual([3, 1, "flop"]);
    s = callThrough(s);
    expect([s.board.length, s.burns.length]).toEqual([5, 3]);
    expect(s.history).toHaveLength(1);
    const next = startHand(s, seededRandom(4));
    expect(next.dealer).toBe(1);
    expect(next.players[0].cards).not.toEqual(original.players[0].cards);
    assertSession(next);
  });
  it("rejects overlapping starts, invalid configuration and duplicate deck", () => {
    expect(() => startHand(game())).toThrow();
    expect(() => createSession({ ...DEFAULT_CONFIG, opponents: 6 })).toThrow();
    expect(() =>
      startHand(createSession(), undefined, Array(52).fill(createDeck()[0])),
    ).toThrow();
  });
  it("hides all private opponents before showdown and never reveals fold winners", () => {
    let s = game();
    expect(
      getPlayView(s)
        .players.slice(1)
        .every((p) => p.cards.length === 0),
    ).toBe(true);
    for (let i = 0; i < 3; i++) s = act(s, "FOLD");
    expect(s.status).toBe("hand_complete");
    expect(s.board).toHaveLength(0);
    expect(s.history[0].revealed).toEqual({});
    expect(
      getPlayView(s)
        .players.slice(1)
        .every((p) => p.cards.length === 0),
    ).toBe(true);
    assertSession(s);
  });
  it("supports partial blinds and refunds unmatched HU blinds without a spurious call", () => {
    let s = createSession(
      { ...DEFAULT_CONFIG, opponents: 1 },
      seededRandom(1),
      0,
    );
    s.dealer = 0;
    s.players[0].stack = 1997;
    s.players[1].stack = 3;
    s = startHand(s, seededRandom(2));
    expect(s.status).not.toBe("hand_in_progress");
    expect(s.history[0].refunds.you).toBe(2);
    expect(
      s.history[0].actions.find((a) => a.type === "BIG_BLIND")?.added,
    ).toBe(3);
    assertSession(s);
  });
  it("adjusts entering heads-up after an actual SB elimination without giving consecutive BB", () => {
    let s = createSession(
      { ...DEFAULT_CONFIG, opponents: 2 },
      seededRandom(1),
      0,
    );
    s.dealer = 0;
    const first = parseCards("Ks 2c As Kh 3c Ah Qc 2s 3d 7h Qd 8c Qh 9d");
    s = startHand(s, undefined, [
      ...first,
      ...createDeck().filter((c) => !first.some((x) => x.id === c.id)),
    ]);
    s = act(s, "ALL_IN");
    s = act(s, "CALL");
    s = act(s, "FOLD");
    assertSession(s);
    expect(s.players[1].stack).toBe(0);
    expect(s.bigBlindSeat).toBe(2);
    s = startHand(s, seededRandom(8));
    expect(s.bigBlindSeat).toBe(0);
    expect(s.dealer).toBe(2);
    expect(s.players[1].cards).toHaveLength(0);
    assertSession(s);
  });
  it("finishes an all-in showdown, eliminates zero stacks, ends HU and rejects more actions", () => {
    let s = game(1);
    s = act(s, "ALL_IN");
    s = act(s, "ALL_IN");
    expect(s.status).toBe("session_complete");
    expect(s.players.filter((p) => p.stack === 0)).toHaveLength(1);
    expect(s.winner).toBeTruthy();
    expect(s.history[0].revealed.you).toHaveLength(2);
    expect(() => act(s, "CHECK")).toThrow();
    expect(() => startHand(s)).toThrow();
    assertSession(s);
  });
  it("stops after resolving a human elimination in a multiway session", () => {
    let found = false;
    for (let seed = 1; seed < 50; seed++) {
      let s = createSession(DEFAULT_CONFIG, seededRandom(seed), 0);
      s = startHand(s, seededRandom(seed + 100));
      while (s.status === "hand_in_progress") s = act(s, "ALL_IN");
      assertSession(s);
      if (s.status === "player_eliminated") {
        found = true;
        expect(s.players[0].place).toBeGreaterThan(1);
        expect(s.winner).toBeNull();
        break;
      }
    }
    expect(found).toBe(true);
  });
});
describe("legal action validation and reopening", () => {
  it("rejects turn mismatch, illegal checks, negative/fractional/oversized/under raises", () => {
    const s = game();
    expect(() => applyAction(s, { type: "CALL", playerId: "you" })).toThrow();
    expect(() => act(s, "CHECK")).toThrow();
    for (const amount of [-10, 20.5, 19, 1001])
      expect(() => act(s, "RAISE", amount)).toThrow();
  });
  it("permits exact minimum raises and checks without mutating prior state", () => {
    const s = game();
    const next = act(s, "RAISE", 20);
    expect(s.players[3].stack).toBe(1000);
    expect(next.players[3].stack).toBe(980);
    expect(next.currentBet).toBe(20);
    expect(next.lastFullRaise).toBe(10);
    expect(next.actor).toBe("you");
  });
  it("rejects a stale command even when the same actor later regains the turn", () => {
    const s = game();
    const n = act(s, "CALL");
    expect(() =>
      applyAction(n, { type: "CALL", playerId: n.actor! }, s.revision),
    ).toThrow("Stale");
  });
  it("makes a partial all-in call with no negative stack", () => {
    let s = game(1, [1970, 30]);
    s = act(s, "RAISE", 100);
    const l = getLegalActions(s, s.actor!);
    expect(l.call).toBe(20);
    expect(l.amountToMatch).toBe(90);
    expect(l.callAllIn).toBe(true);
    s = act(s, "CALL");
    expect(s.history[0].refunds.you).toBe(70);
    assertSession(s);
  });
  it("short all-in does not reopen a previous caller but permits an unacted player", () => {
    let s = game(3, [1000, 140, 1000, 1000]);
    s = act(s, "RAISE", 100);
    s = act(s, "CALL");
    s = act(s, "ALL_IN");
    expect(s.currentBet).toBe(140);
    expect(s.lastFullRaise).toBe(90);
    expect(getLegalActions(s, s.actor!).reopened).toBe(true);
    s = act(s, "CALL");
    expect(s.actor).toBe("npc-3");
    expect(getLegalActions(s, s.actor!).raise).toBe(false);
    expect(getLegalActions(s, s.actor!).allIn).toBe(false);
    expect(() => act(s, "RAISE", 230)).toThrow();
    s = act(s, "CALL");
    s = act(s, "CALL");
    expect(s.street).toBe("flop");
  });
  it("cumulative short all-ins reopen at each individual threshold", () => {
    let s = game(4, [1000, 140, 190, 1000, 1000]); // dealer0 -> SB1 BB2 actor3, then4 then0 then1 then2
    s = act(s, "RAISE", 100);
    s = act(s, "CALL");
    s = act(s, "CALL");
    s = act(s, "ALL_IN");
    s = act(s, "ALL_IN");
    expect(s.currentBet).toBe(190);
    expect(s.lastFullRaise).toBe(90);
    expect(s.actor).toBe("npc-3");
    expect(getLegalActions(s, s.actor!).reopened).toBe(true);
    expect(getLegalActions(s, s.actor!).minTo).toBe(280);
    s = act(s, "RAISE", 280);
    assertSession(s);
  });
  it("a caller of the first short raise needs a fresh full increment", () => {
    let s = game(4, [1000, 190, 1000, 1000, 140]);
    s = act(s, "RAISE", 100);
    s = act(s, "ALL_IN");
    s = act(s, "CALL");
    s = act(s, "ALL_IN");
    s = act(s, "CALL");
    expect(s.actor).toBe("npc-3");
    expect(getLegalActions(s, s.actor!).reopened).toBe(true);
    s = act(s, "CALL");
    expect(s.actor).toBe("you");
    expect(getLegalActions(s, "you").reopened).toBe(false);
  });
  it("opening short all-in adds the minimum increment rather than completion", () => {
    let s = game(2);
    while (s.street === "preflop")
      s = act(s, getLegalActions(s, s.actor!).check ? "CHECK" : "CALL");
    const p = s.players.find((p) => p.id === s.actor)!;
    const diff = p.stack - 4;
    p.stack = 4;
    s.initialStacks[s.players.indexOf(p)] -= diff;
    const other = s.players.find((q) => q.id !== p.id)!;
    other.stack += diff;
    s.initialStacks[s.players.indexOf(other)] += diff;
    s = act(s, "ALL_IN");
    expect(s.currentBet).toBe(4);
    expect(getLegalActions(s, s.actor!).minTo).toBe(14);
    s = act(s, "RAISE", 14);
    expect(s.lastFullRaise).toBe(10);
    assertSession(s);
  });
  it("supports all-in below min raise only through the dedicated action", () => {
    let s = game(3, [1000, 15, 1000, 1000]);
    s = act(s, "CALL");
    s = act(s, "CALL");
    const l = getLegalActions(s, s.actor!);
    expect(l.allInKind).toBe("short-raise");
    expect(l.raise).toBe(false);
    s = act(s, "ALL_IN");
    expect(s.currentBet).toBe(15);
    assertSession(s);
  });
  it("has no dry side-pot raises against all-in opponents", () => {
    let s = game(1);
    s = act(s, "ALL_IN");
    const l = getLegalActions(s, s.actor!);
    expect(l.raise).toBe(false);
    expect(l.callAllIn).toBe(true);
    expect(l.allInKind).toBe("call");
  });
  it("safe validation never permits folded or eliminated actors", () => {
    const s = game();
    s.players[3].folded = true;
    expect(
      validateAction(s, { type: "CALL", playerId: s.actor! }),
    ).toBeTruthy();
  });
});
describe("standalone pot layers, refunds and awards", () => {
  it("rejects duplicate physical cards across participants or the board and invalid dealer positions", () => {
    const board = parseCards("2s 3d 7h 8c 9d");
    const players = [contender("a", 20, "As Ah"), contender("b", 20, "As Kh")];
    expect(() => resolvePots(players, board, 0)).toThrow("Duplicate card");
    players[1].cards = parseCards("2s Kh");
    expect(() => resolvePots(players, board, 0)).toThrow("Duplicate card");
    players[1].cards = parseCards("Ks Kh");
    for (const dealer of [-1, 0.5, 2])
      expect(() => resolvePots(players, board, dealer)).toThrow("dealer position");
    players[1].cards = [];
    expect(() => resolvePots(players, board, 0)).toThrow("two private cards");
  });
  it("builds multiple side pots including folded chips and unmatched refund", () => {
    const p = [
      contender("a", 50, "As Ah"),
      contender("b", 100, "Ks Kh"),
      contender("c", 200, "Qs Qh"),
      contender("d", 150, "Js Jh", true),
    ];
    const r = buildPots(p);
    expect(r.pots.map((p) => p.amount)).toEqual([200, 150, 100]);
    expect(r.refunds).toEqual({ c: 50 });
    expect(r.pots[2].eligible).toEqual(["c"]);
  });
  it("awards different winners in each pot and conserves chips", () => {
    const p = [
      contender("a", 50, "As Ah"),
      contender("b", 100, "Ks Kh"),
      contender("c", 200, "Qs Qh"),
      contender("d", 150, "Js Jh", true),
    ];
    const r = resolvePots(p, parseCards("2s 3d 7h 8c 9d"), 0);
    expect(r.awards.map((a) => a.winners)).toEqual([["a"], ["b"], ["c"]]);
    expect(
      r.awards.reduce((n, p) => n + p.amount, 0) +
        Object.values(r.refunds).reduce((a, b) => a + b, 0),
    ).toBe(500);
  });
  it("splits board-only ties independently with odd chip left of dealer", () => {
    const p = [
      contender("a", 5, "2s 3s"),
      contender("b", 5, "4h 5h"),
      contender("c", 5, "6h 7h", true),
    ];
    const r = resolvePots(p, parseCards("As Ks Qs Js Ts"), 0);
    expect(r.awards[0].payouts).toEqual({ b: 8, a: 7 });
  });
  it("awards fold winners and returns uncalled excess without exposing cards", () => {
    const p = [contender("a", 100, "As Ah"), contender("b", 20, "Ks Kh", true)];
    const r = resolvePots(p, [], 0);
    expect(r.awards[0].payouts.a).toBe(40);
    expect(r.refunds.a).toBe(80);
  });
  it("rejects negative or impossible contributions and incomplete contested showdown", () => {
    expect(() => buildPots([contender("a", -1, "As Ah")])).toThrow();
    expect(() =>
      buildPots([
        contender("a", 20, "As Ah", true),
        contender("b", 20, "Ks Kh", true),
      ]),
    ).toThrow();
    expect(() =>
      resolvePots(
        [contender("a", 20, "As Ah"), contender("b", 20, "Ks Kh")],
        [],
        0,
      ),
    ).toThrow();
  });
});
it("combines contribution layers with identical eligibility instead of inventing side pots from folded chips", () => {
  const p = [
    contender("a", 29, "As Ah"),
    contender("b", 29, "Ks Kh"),
    contender("c", 10, "Qs Qh", true),
  ];
  const { pots } = buildPots(p);
  expect(pots).toHaveLength(1);
  expect(pots[0].amount).toBe(68);
});
