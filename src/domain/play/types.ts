import type { Card, Difficulty } from "../types";

export type Personality = "cautious" | "aggressive" | "casual" | "analytical";
export type Pacing = "instant" | "normal" | "relaxed";
export type Street = "preflop" | "flop" | "turn" | "river";
export type SessionStatus =
  | "new_session"
  | "hand_in_progress"
  | "hand_complete"
  | "player_eliminated"
  | "session_complete";
export interface SessionConfig {
  opponents: number;
  startingStack: number;
  smallBlind: number;
  bigBlind: number;
  difficulty: Difficulty;
}
export const DEFAULT_CONFIG: SessionConfig = {
  opponents: 3,
  startingStack: 1000,
  smallBlind: 5,
  bigBlind: 10,
  difficulty: "standard",
};
export interface Seat {
  id: string;
  name: string;
  personality: Personality;
  stack: number;
  cards: Card[];
  folded: boolean;
  streetChips: number;
  committed: number;
  /** null means no voluntary action this street. Blinds never count as action. */
  actedAt: number | null;
  /** Full raise size at this player's last action, for cumulative reopening. */
  reopenSize: number;
  lastAction: string;
  eliminatedHand: number | null;
  place: number | null;
}
export interface PublicAction {
  sequence: number;
  street: Street;
  playerId: string;
  type: Action["type"] | "SMALL_BLIND" | "BIG_BLIND" | "REFUND";
  added: number;
  total: number;
}
export type Action =
  | { type: "FOLD" | "CHECK" | "CALL" | "ALL_IN"; playerId: string }
  | { type: "BET" | "RAISE"; playerId: string; to: number };
export interface LegalActions {
  playerId: string;
  fold: boolean;
  check: boolean;
  call: number;
  amountToMatch: number;
  callAllIn: boolean;
  bet: boolean;
  raise: boolean;
  reopened: boolean;
  minTo: number;
  maxTo: number;
  allIn: boolean;
  allInKind: "call" | "full-raise" | "short-raise" | null;
}
export interface PotLayer {
  amount: number;
  eligible: string[];
  contributors: string[];
}
export interface PotAward extends PotLayer {
  winners: string[];
  payouts: Record<string, number>;
  explanation: string;
}
export interface HandRecord {
  number: number;
  dealer: number;
  smallBlind: number;
  bigBlind: number;
  initialStacks: number[];
  finalStacks: number[];
  actions: PublicAction[];
  board: Card[];
  revealed: Record<string, Card[]>;
  awards: PotAward[];
  refunds: Record<string, number>;
  reason: "folds" | "showdown";
}
export interface Session {
  version: 2;
  id: string;
  revision: number;
  config: SessionConfig;
  status: SessionStatus;
  startedAt: number;
  finishedAt: number | null;
  supply: number;
  players: Seat[];
  dealer: number;
  smallBlindSeat: number;
  bigBlindSeat: number;
  handNumber: number;
  street: Street;
  actor: string | null;
  currentBet: number;
  lastFullRaise: number;
  deck: Card[];
  board: Card[];
  burns: Card[];
  initialStacks: number[];
  actions: PublicAction[];
  history: HandRecord[];
  winner: string | null;
}
export interface PlayView {
  status: SessionStatus;
  players: Seat[];
  board: Card[];
  dealer: number;
  smallBlindSeat: number;
  bigBlindSeat: number;
  actor: string | null;
  street: Street;
  handNumber: number;
  pot: number;
  pots: PotLayer[];
  actions: PublicAction[];
  history: HandRecord[];
  winner: string | null;
}
