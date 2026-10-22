import type { Card, Deck, RandomSource, Rank, Suit } from "./types";

export const SUITS: readonly Suit[] = ["clubs", "diamonds", "hearts", "spades"];
export const RANKS: readonly Rank[] = [
  2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
];
const suitCode: Record<Suit, string> = {
  clubs: "c",
  diamonds: "d",
  hearts: "h",
  spades: "s",
};
const rankCodes: Record<number, string> = {
  10: "T",
  11: "J",
  12: "Q",
  13: "K",
  14: "A",
};
const rankCode = (rank: Rank): string => rankCodes[rank] ?? String(rank);
export const cardId = (rank: Rank, suit: Suit): string =>
  `${rankCode(rank)}${suitCode[suit]}`;

export function createDeck(): Card[] {
  return SUITS.flatMap((suit) =>
    RANKS.map((rank) => ({ id: cardId(rank, suit), rank, suit })),
  );
}

/** Validate both the physical card identity and its canonical serialized ID. */
export function validateCards(cards: Deck): void {
  const seen = new Set<string>();
  for (const card of cards) {
    if (
      !card ||
      !RANKS.includes(card.rank) ||
      !SUITS.includes(card.suit) ||
      card.id !== cardId(card.rank, card.suit)
    ) {
      throw new Error(
        "Invalid card: ranks, suits and canonical card IDs must agree.",
      );
    }
    if (seen.has(card.id)) throw new Error(`Duplicate card: ${card.id}`);
    seen.add(card.id);
  }
}

/** Uniform integer through rejection sampling; no modulo bias. */
function secureIndex(exclusiveMax: number): number {
  const range = 0x100000000;
  const ceiling = Math.floor(range / exclusiveMax) * exclusiveMax;
  const value = new Uint32Array(1);
  do {
    globalThis.crypto.getRandomValues(value);
  } while (value[0] >= ceiling);
  return value[0] % exclusiveMax;
}

export function shuffle(deck: Deck, random?: RandomSource): Card[] {
  validateCards(deck);
  const result = [...deck];
  for (let i = result.length - 1; i > 0; i--) {
    let j: number;
    if (random) {
      const value = random();
      if (!Number.isFinite(value) || value < 0 || value >= 1)
        throw new Error("Random source must return a number in [0, 1).");
      j = Math.floor(value * (i + 1));
    } else j = secureIndex(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Mulberry32: deterministic fixtures only, never ordinary dealing. */
export function seededRandom(seed: number): RandomSource {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let n = Math.imul(state ^ (state >>> 15), 1 | state);
    n ^= n + Math.imul(n ^ (n >>> 7), 61 | n);
    return ((n ^ (n >>> 14)) >>> 0) / 0x100000000;
  };
}

export function deal(
  deck: Deck,
  count: number,
): { cards: Card[]; remaining: Card[] } {
  validateCards(deck);
  if (!Number.isInteger(count) || count < 0)
    throw new Error("Deal count must be a nonnegative integer.");
  if (count > deck.length) throw new Error("Deck exhausted.");
  return { cards: deck.slice(0, count), remaining: deck.slice(count) };
}

export function removeCards(deck: Deck, cards: Deck): Card[] {
  validateCards(deck);
  validateCards(cards);
  const present = new Set(deck.map((card) => card.id));
  if (cards.some((card) => !present.has(card.id)))
    throw new Error("Cannot remove a card absent from the deck.");
  const removed = new Set(cards.map((card) => card.id));
  return deck.filter((card) => !removed.has(card.id));
}

export function parseCards(text: string): Card[] {
  const suits: Record<string, Suit> = {
    c: "clubs",
    d: "diamonds",
    h: "hearts",
    s: "spades",
  };
  const ranks: Record<string, Rank> = {
    "2": 2,
    "3": 3,
    "4": 4,
    "5": 5,
    "6": 6,
    "7": 7,
    "8": 8,
    "9": 9,
    T: 10,
    J: 11,
    Q: 12,
    K: 13,
    A: 14,
  };
  if (!text.trim()) return [];
  const cards = text
    .trim()
    .split(/\s+/)
    .map((token) => {
      const match = /^(10|[2-9TJQKA])([cdhs])$/i.exec(token);
      if (!match) throw new Error(`Invalid card notation: ${token}`);
      const rank =
        ranks[match[1].toUpperCase() === "10" ? "T" : match[1].toUpperCase()];
      const suit = suits[match[2].toLowerCase()];
      return { id: cardId(rank, suit), rank, suit };
    });
  validateCards(cards);
  return cards;
}
