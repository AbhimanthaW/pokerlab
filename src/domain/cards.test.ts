import { describe, expect, it } from "vitest";
import {
  cardId,
  createDeck,
  deal,
  parseCards,
  removeCards,
  seededRandom,
  shuffle,
  validateCards,
} from "./cards";

describe("deck construction and integrity", () => {
  it("contains exactly 52 unique canonical cards, four suits and thirteen ranks", () => {
    const deck = createDeck();
    expect(deck).toHaveLength(52);
    expect(new Set(deck.map((card) => card.id)).size).toBe(52);
    expect(new Set(deck.map((card) => card.rank)).size).toBe(13);
    expect(new Set(deck.map((card) => card.suit)).size).toBe(4);
    expect(deck.every((card) => card.id === cardId(card.rank, card.suit))).toBe(
      true,
    );
  });
  it("deals sequentially without mutating the deck or duplicating a card", () => {
    const deck = createDeck();
    const first = deal(deck, 12);
    const second = deal(first.remaining, 5);
    expect(first.cards).toEqual(deck.slice(0, 12));
    expect(first.remaining).toHaveLength(40);
    expect(second.remaining).toHaveLength(35);
    expect(
      new Set(
        [...first.cards, ...second.cards, ...second.remaining].map(
          (card) => card.id,
        ),
      ).size,
    ).toBe(52);
    expect(deck).toHaveLength(52);
  });
  it("handles complete exhaustion and rejects invalid counts", () => {
    expect(deal(createDeck(), 52).remaining).toEqual([]);
    expect(deal([], 0).cards).toEqual([]);
    expect(() => deal([], 1)).toThrow(/exhausted/);
    expect(() => deal(createDeck(), -1)).toThrow();
    expect(() => deal(createDeck(), 1.5)).toThrow();
  });
  it("shuffles deterministically with injected randomness and preserves each card", () => {
    const source = createDeck();
    const result = shuffle(source, seededRandom(42));
    expect(result).toEqual(shuffle(source, seededRandom(42)));
    expect(result).not.toEqual(source);
    expect(shuffle(source, seededRandom(43))).not.toEqual(result);
    expect(new Set(result.map((card) => card.id)).size).toBe(52);
    expect(source).toEqual(createDeck());
    expect(() => shuffle(source, () => 1)).toThrow();
    expect(() => shuffle(source, () => Number.NaN)).toThrow();
  });
  it("ordinary secure shuffle preserves deck identity", () => {
    const result = shuffle(createDeck());
    expect(result).toHaveLength(52);
    expect(new Set(result.map((card) => card.id)).size).toBe(52);
  });
  it("removes cards with duplicate and absent-card protection", () => {
    const cards = parseCards("As Th");
    const result = removeCards(createDeck(), cards);
    expect(result).toHaveLength(50);
    expect(result.some((card) => ["As", "Th"].includes(card.id))).toBe(false);
    expect(() => removeCards(result, cards)).toThrow(/absent/);
    expect(() => removeCards(createDeck(), [cards[0], cards[0]])).toThrow(
      /Duplicate/,
    );
  });
  it("parses canonical shorthand and rejects invalid or forged identities", () => {
    expect(parseCards("as 10H Qd 2c").map((card) => card.id)).toEqual([
      "As",
      "Th",
      "Qd",
      "2c",
    ]);
    expect(() => parseCards("Ah Ah")).toThrow(/Duplicate/);
    expect(() => parseCards("1s")).toThrow();
    expect(() =>
      validateCards([{ id: "Ks", suit: "spades", rank: 14 }]),
    ).toThrow(/Invalid/);
  });
});
