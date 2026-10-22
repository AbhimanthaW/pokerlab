import { getLegalActions } from "./engine";
import type { Card, Difficulty } from "../types";
import type {
  LegalActions,
  Personality,
  PublicAction,
  Session,
  Street,
} from "./types";

export interface NpcObservation {
  readonly playerId: string;
  readonly privateCards: readonly Card[];
  readonly board: readonly Card[];
  readonly stack: number;
  readonly participants: readonly {
    id: string;
    stack: number;
    contribution: number;
    streetChips: number;
    folded: boolean;
    inHand: boolean;
    seat: number;
  }[];
  readonly pot: number;
  readonly dealer: number;
  readonly smallBlind: number;
  readonly bigBlind: number;
  readonly bigBlindAmount: number;
  readonly street: Street;
  readonly actions: readonly PublicAction[];
  readonly legal: Readonly<LegalActions>;
  readonly personality: Personality;
  readonly difficulty: Difficulty;
}
function freeze<T>(value: T): T {
  if (value && typeof value === "object") {
    Object.freeze(value);
    for (const v of Object.values(value)) freeze(v);
  }
  return value;
}
/** Explicit allowlist, detached copies and deep freeze. The policy never imports Session. */
export function observeNpc(s: Session, playerId: string): NpcObservation {
  const p = s.players.find((p) => p.id === playerId);
  if (
    !p ||
    p.id === "you" ||
    s.actor !== playerId ||
    s.status !== "hand_in_progress"
  )
    throw new Error("NPC observation requires its live turn");
  return freeze(
    structuredClone({
      playerId,
      privateCards: p.cards,
      board: s.board,
      stack: p.stack,
      participants: s.players.map((p, seat) => ({
        id: p.id,
        stack: p.stack,
        contribution: p.committed,
        streetChips: p.streetChips,
        folded: p.folded,
        inHand: p.cards.length === 2,
        seat,
      })),
      pot: s.players.reduce((n, p) => n + p.committed, 0),
      dealer: s.dealer,
      smallBlind: s.smallBlindSeat,
      bigBlind: s.bigBlindSeat,
      bigBlindAmount: s.config.bigBlind,
      street: s.street,
      actions: s.actions,
      legal: getLegalActions(s, playerId),
      personality: p.personality,
      difficulty: s.config.difficulty,
    }),
  );
}
