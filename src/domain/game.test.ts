import { describe, expect, it } from "vitest";
import {
  createDeck,
  parseCards,
  removeCards,
  seededRandom,
  shuffle,
} from "./cards";
import { gameReducer, getVisiblePlayers, initialGame } from "./game";
import type { GameState } from "./types";

const start = (opponents = 2) =>
  gameReducer(initialGame, {
    type: "START",
    opponents,
    deck: shuffle(createDeck(), seededRandom(28)),
  });
const advance = (state: GameState, count = 1): GameState =>
  count ? advance(gameReducer(state, { type: "ADVANCE" }), count - 1) : state;

describe("practice table state machine", () => {
  it.each([1, 2, 3, 4, 5])(
    "deals two cards round-robin to human and %i opponents",
    (opponents) => {
      const state = start(opponents);
      expect(state.phase).toBe("private");
      expect(state.players).toHaveLength(opponents + 1);
      expect(state.players.every((player) => player.cards.length === 2)).toBe(
        true,
      );
      expect(state.deck).toHaveLength(52 - (opponents + 1) * 2);
      expect(
        new Set(
          [
            ...state.deck,
            ...state.players.flatMap((player) => player.cards),
          ].map((card) => card.id),
        ).size,
      ).toBe(52);
      const deck = createDeck();
      const ordered = gameReducer(initialGame, {
        type: "START",
        opponents,
        deck,
      });
      expect(ordered.players[0].cards).toEqual([deck[0], deck[opponents + 1]]);
    },
  );
  it("advances private → flop → turn → river → showdown → review with burns", () => {
    const privateState = start();
    const flop = advance(privateState);
    const turn = advance(flop);
    const river = advance(turn);
    const showdown = advance(river);
    expect([
      privateState.phase,
      flop.phase,
      turn.phase,
      river.phase,
      showdown.phase,
      advance(showdown).phase,
    ]).toEqual(["private", "flop", "turn", "river", "showdown", "review"]);
    expect([
      privateState.community.length,
      flop.community.length,
      turn.community.length,
      river.community.length,
    ]).toEqual([0, 3, 4, 5]);
    expect(flop.community).toEqual(privateState.deck.slice(1, 4));
    expect(turn.community[3]).toEqual(flop.deck[1]);
    expect(river.community[4]).toEqual(turn.deck[1]);
    expect(river.deck).toHaveLength(38);
    expect(showdown.results).toHaveLength(3);
    expect(showdown.winners.length).toBeGreaterThan(0);
    expect(
      new Set(
        [
          ...river.community,
          ...river.players.flatMap((player) => player.cards),
          ...river.deck,
        ].map((card) => card.id),
      ).size,
    ).toBe(49);
  });
  it("projects opponent cards as hidden until showdown", () => {
    let state = start();
    for (let i = 0; i < 4; i++) {
      const visible = getVisiblePlayers(state);
      expect(visible[0].cards).toHaveLength(2);
      expect(
        visible.slice(1).every((player) => player.cards.length === 0),
      ).toBe(true);
      expect(
        state.players.slice(1).every((player) => player.cards.length === 2),
      ).toBe(true);
      state = advance(state);
    }
    expect(
      getVisiblePlayers(state).every((player) => player.cards.length === 2),
    ).toBe(true);
  });
  it("rejects overlapping starts, repeated review advances and malformed starts", () => {
    expect(advance(initialGame)).toBe(initialGame);
    const state = start();
    expect(gameReducer(state, { type: "START", opponents: 2 })).toBe(state);
    for (const opponents of [0, 6, 1.5, Number.NaN])
      expect(gameReducer(initialGame, { type: "START", opponents })).toBe(
        initialGame,
      );
    expect(
      gameReducer(initialGame, {
        type: "START",
        opponents: 2,
        deck: createDeck().slice(1),
      }),
    ).toBe(initialGame);
    const deck = createDeck();
    deck[1] = deck[0];
    expect(
      gameReducer(initialGame, { type: "START", opponents: 2, deck }),
    ).toBe(initialGame);
    const review = advance(state, 5);
    expect(advance(review)).toBe(review);
  });
  it("rejects incomplete showdown evaluation", () => {
    const river = advance(start(), 3);
    expect(
      advance({ ...river, community: river.community.slice(1) }).results,
    ).toEqual([]);
    expect(advance({ ...river, players: [] }).results).toEqual([]);
    expect(
      advance({
        ...river,
        players: [
          { ...river.players[0], cards: river.community.slice(0, 2) },
          river.players[1],
        ],
      }).results,
    ).toEqual([]);
  });
  it("identifies all tied winners on a royal-flush board", () => {
    // Two players, two private rounds, flop burn, three board cards, turn burn/card, river burn/card.
    const prefix = parseCards("2h 3h 4h 5h 6c As Ks Qs 7c Js 8c Ts");
    const deck = [...prefix, ...removeCards(createDeck(), prefix)];
    const state = advance(
      gameReducer(initialGame, { type: "START", opponents: 1, deck }),
      4,
    );
    expect(state.winners).toEqual(["you", "opponent-1"]);
    expect(
      state.results.every((result) =>
        result.hand.description.includes("Royal flush"),
      ),
    ).toBe(true);
  });
  it("restarts with a clean deck after showdown, reset preserves hand counter only", () => {
    const showdown = advance(start(), 4);
    const next = gameReducer(showdown, { type: "START", opponents: 5 });
    expect(next.handNumber).toBe(2);
    expect(next.community).toEqual([]);
    expect(next.results).toEqual([]);
    expect(next.winners).toEqual([]);
    expect(next.players).toHaveLength(6);
    const reset = gameReducer(next, { type: "RESET" });
    expect(reset).toEqual({ ...initialGame, handNumber: 2 });
    expect(gameReducer(reset, { type: "START", opponents: 1 }).handNumber).toBe(
      3,
    );
  });
});
