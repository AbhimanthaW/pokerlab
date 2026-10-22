import { createDeck, deal, shuffle, validateCards } from "./cards";
import { compareHands, evaluate } from "./evaluation";
import type { GameAction, GameState, Player } from "./types";

export const initialGame: GameState = {
  phase: "idle",
  handNumber: 0,
  players: [],
  community: [],
  deck: [],
  results: [],
  winners: [],
};
const opponentNames = ["Alex", "Morgan", "Sam", "Robin", "Casey"];

/** Invalid transitions are rejected by preserving the exact previous state. */
export function gameReducer(state: GameState, action: GameAction): GameState {
  if (action.type === "RESET")
    return { ...initialGame, handNumber: state.handNumber };
  if (action.type === "START") {
    if (
      !["idle", "showdown", "review"].includes(state.phase) ||
      !Number.isInteger(action.opponents) ||
      action.opponents < 1 ||
      action.opponents > 5
    )
      return state;
    const deck = action.deck ? [...action.deck] : shuffle(createDeck());
    try {
      validateCards(deck);
    } catch {
      return state;
    }
    if (deck.length !== 52) return state;
    const players: Player[] = [
      { id: "you", name: "You", cards: [] },
      ...opponentNames
        .slice(0, action.opponents)
        .map((name, i) => ({ id: `opponent-${i + 1}`, name, cards: [] })),
    ];
    const dealt = deal(deck, players.length * 2);
    for (let round = 0; round < 2; round++)
      players.forEach((player, i) =>
        player.cards.push(dealt.cards[round * players.length + i]),
      );
    return {
      phase: "private",
      handNumber: state.handNumber + 1,
      players,
      community: [],
      deck: dealt.remaining,
      results: [],
      winners: [],
    };
  }
  if (action.type === "ADVANCE") {
    if (["private", "flop", "turn"].includes(state.phase)) {
      const count = state.phase === "private" ? 3 : 1;
      if (state.deck.length < count + 1) return state;
      const dealt = deal(state.deck, count + 1); // First card is burned, never visible.
      return {
        ...state,
        phase:
          state.phase === "private"
            ? "flop"
            : state.phase === "flop"
              ? "turn"
              : "river",
        community: [...state.community, ...dealt.cards.slice(1)],
        deck: dealt.remaining,
      };
    }
    if (state.phase === "river") {
      if (
        state.community.length !== 5 ||
        state.players.length < 2 ||
        state.players.some((player) => player.cards.length !== 2)
      )
        return state;
      try {
        validateCards([
          ...state.community,
          ...state.players.flatMap((player) => player.cards),
        ]);
      } catch {
        return state;
      }
      const results = state.players.map((player) => ({
        playerId: player.id,
        hand: evaluate([...player.cards, ...state.community]),
      }));
      const best = results.reduce((a, b) =>
        compareHands(a.hand, b.hand) >= 0 ? a : b,
      );
      const winners = results
        .filter((result) => compareHands(result.hand, best.hand) === 0)
        .map((result) => result.playerId);
      return { ...state, phase: "showdown", results, winners };
    }
    if (state.phase === "showdown") return { ...state, phase: "review" };
  }
  return state;
}

/** This projection is the only player-card source the table should render. */
export function getVisiblePlayers(state: GameState): Player[] {
  const revealed = state.phase === "showdown" || state.phase === "review";
  return state.players.map((player) => ({
    ...player,
    cards: player.id === "you" || revealed ? [...player.cards] : [],
  }));
}
