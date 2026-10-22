export type Suit = "clubs" | "diamonds" | "hearts" | "spades";
export type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;
export interface Card {
  readonly id: string;
  readonly rank: Rank;
  readonly suit: Suit;
}
export type Deck = readonly Card[];
export type RandomSource = () => number;
export const CATEGORIES = [
  "High Card",
  "One Pair",
  "Two Pair",
  "Three of a Kind",
  "Straight",
  "Flush",
  "Full House",
  "Four of a Kind",
  "Straight Flush",
] as const;
export type HandCategory = (typeof CATEGORIES)[number];
export interface EvaluatedHand {
  category: HandCategory;
  categoryRank: number;
  tuple: number[];
  tieBreakers: number[];
  bestFive: Card[];
  description: string;
}
export interface Player {
  id: string;
  name: string;
  cards: Card[];
}
export type Phase =
  "idle" | "private" | "flop" | "turn" | "river" | "showdown" | "review";
export interface GameState {
  phase: Phase;
  handNumber: number;
  players: Player[];
  community: Card[];
  deck: Card[];
  results: { playerId: string; hand: EvaluatedHand }[];
  winners: string[];
}
export type GameAction =
  | { type: "START"; opponents: number; deck?: Card[] }
  | { type: "ADVANCE" }
  | { type: "RESET" };
export type Difficulty = "beginner" | "standard" | "challenge";
export type ExerciseKind =
  "recognition" | "best-five" | "comparison" | "prediction";
export interface Exercise {
  id: string;
  kind: ExerciseKind;
  cards: Card[];
  otherCards?: Card[];
  prompt: string;
}
export type Answer =
  | { type: "category"; category: HandCategory }
  | { type: "selection"; cardIds: string[] }
  | { type: "comparison"; winner: "a" | "b" | "tie" }
  | { type: "prediction"; winner: string }
  | { type: "skip" };
export interface EvaluationResult {
  status: "correct" | "incorrect" | "skipped";
  explanation: string;
  expectedCategory?: HandCategory;
  bestFive?: Card[];
}
export interface ExerciseRecord extends EvaluationResult {
  id: string;
  kind: ExerciseKind;
  timestamp: number;
  context: string;
}
export interface Settings {
  opponents: number;
  difficulty: Difficulty;
  animation: "slow" | "normal" | "fast";
  reducedMotion: boolean;
  fourColor: boolean;
}
