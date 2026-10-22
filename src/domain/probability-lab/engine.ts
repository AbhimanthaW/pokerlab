import { createDeck, validateCards, seededRandom, shuffle } from "../cards";
import { evaluate } from "../evaluation";
import { CATEGORIES, type Card, type Rank, type Suit } from "../types";
export interface LabScenario { privateCards: Card[]; board: Card[]; unavailable: Card[] }
export interface Ratio { favorable: number; total: number }
export interface Distribution { method: "exact" | "simulation"; counts: number[]; total: number; possible: number; seed?: number }
export const EXACT_LIMIT = 25000, SAMPLE_LIMIT = 100000;
export function choose(n: number, k: number): number {
  if (!Number.isSafeInteger(n) || !Number.isSafeInteger(k) || n < 0 || k < 0) throw new Error("Combinations require nonnegative integers");
  if (k > n) return 0;
  k = Math.min(k, n - k); let result = 1;
  for (let i = 1; i <= k; i++) result = result * (n - k + i) / i;
  result = Math.round(result); if (!Number.isSafeInteger(result)) throw new Error("Combination count exceeds exact integer range"); return result;
}
export function unseenCards(s: LabScenario, complete = false): Card[] {
  if (!s || !Array.isArray(s.privateCards) || !Array.isArray(s.board) || !Array.isArray(s.unavailable) || s.privateCards.length > 2 || (complete && s.privateCards.length !== 2) || s.board.length > 5 || s.unavailable.length > 20) throw new Error("Use two private cards, zero to five board cards, and up to 20 unavailable cards");
  const known = [...s.privateCards, ...s.board, ...s.unavailable]; validateCards(known);
  const ids = new Set(known.map((c) => c.id)); const unseen = createDeck().filter((c) => !ids.has(c.id));
  if (unseen.length < 5 - s.board.length) throw new Error("Not enough unseen cards to complete the board"); return unseen;
}
export function nextCard(s: LabScenario, target: { suit: Suit } | { rank: Rank }): Ratio {
  const unseen = unseenCards(s); return { favorable: unseen.filter((c) => "suit" in target ? c.suit === target.suit : c.rank === target.rank).length, total: unseen.length };
}
/** Hypergeometric: P(at least one target in d draws), without replacement. */
export function atLeastOne(remaining: number, targets: number, draws: number): Ratio {
  if (!Number.isSafeInteger(targets) || targets < 0 || targets > remaining || draws > remaining) throw new Error("Invalid drawing counts");
  const total = choose(remaining, draws); return { favorable: total - choose(remaining - targets, draws), total };
}
export function outcomeCount(s: LabScenario): number { const unseen = unseenCards(s, true); return choose(unseen.length, 5 - s.board.length); }
export function* exactDistribution(s: LabScenario): Generator<{ done: number; total: number }, Distribution> {
  const unseen = unseenCards(s, true), missing = 5 - s.board.length, total = choose(unseen.length, missing);
  if (total > EXACT_LIMIT) throw new Error(`${total.toLocaleString()} combinations exceed the ${EXACT_LIMIT.toLocaleString()} exact limit. Add known board cards or use simulation.`);
  const counts = CATEGORIES.map(() => 0), indices = Array.from({ length: missing }, (_, i) => i);
  let done = 0;
  while (true) {
    const cards = indices.map((i) => unseen[i]); counts[evaluate([...s.privateCards, ...s.board, ...cards]).categoryRank]++; done++;
    if (done % 100 === 0) yield { done, total };
    let p = missing - 1;
    while (p >= 0 && indices[p] === unseen.length - missing + p) p--;
    if (p < 0) break;
    indices[p]++; for (let i = p + 1; i < missing; i++) indices[i] = indices[i - 1] + 1;
  }
  return { method: "exact", counts, total: done, possible: total };
}
export function* simulateDistribution(s: LabScenario, samples: number, seed: number): Generator<{ done: number; total: number }, Distribution> {
  const unseen = unseenCards(s, true), missing = 5 - s.board.length;
  if (!Number.isSafeInteger(samples) || samples < 100 || samples > SAMPLE_LIMIT || !Number.isSafeInteger(seed) || seed < 0 || seed > 4294967295) throw new Error("Use 100–100,000 samples and an unsigned 32-bit seed");
  const counts = CATEGORIES.map(() => 0), random = seededRandom(seed);
  for (let done = 1; done <= samples; done++) {
    // Partial Fisher–Yates: each trial samples a new unordered completion without replacement.
    const pool = [...unseen];
    for (let i = 0; i < missing; i++) { const j = i + Math.floor(random() * (pool.length - i)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    counts[evaluate([...s.privateCards, ...s.board, ...pool.slice(0, missing)]).categoryRank]++;
    if (done % 100 === 0) yield { done, total: samples };
  }
  return { method: "simulation", counts, total: samples, possible: choose(unseen.length, missing), seed };
}
/** Per-category Wilson score interval, 95%; not a simultaneous multinomial interval. */
export function wilson(successes: number, trials: number): [number, number] {
  if (trials < 1 || successes < 0 || successes > trials) throw new Error("Invalid trial counts");
  const z = 1.959963984540054, p = successes / trials, denominator = 1 + z * z / trials;
  const center = (p + z * z / (2 * trials)) / denominator;
  const half = z * Math.sqrt(p * (1 - p) / trials + z * z / (4 * trials * trials)) / denominator;
  return [Math.max(0, center - half), Math.min(1, center + half)];
}
export function randomScenario(boardCount: number): LabScenario {
  if (!Number.isInteger(boardCount) || boardCount < 0 || boardCount > 5) throw new Error("Invalid board count");
  const deck = shuffle(createDeck()); return { privateCards: deck.slice(0, 2), board: deck.slice(2, 2 + boardCount), unavailable: [] };
}
