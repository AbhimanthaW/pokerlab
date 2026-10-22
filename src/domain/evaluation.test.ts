import { describe, expect, it } from "vitest";
import { parseCards } from "./cards";
import { combinations, compareHands, evaluate } from "./evaluation";
import { CATEGORIES } from "./types";

const hand = (cards: string) => evaluate(parseCards(cards));
const fixtures = [
  "As Kd 9h 7c 3s",
  "As Ad 9h 7c 3s",
  "As Ad 9h 9c 3s",
  "As Ad Ah 7c 3s",
  "9s 8d 7h 6c 5s",
  "As Js 9s 7s 3s",
  "As Ad Ah 7c 7s",
  "As Ad Ah Ac 3s",
  "9s 8s 7s 6s 5s",
];

describe("five-card evaluator", () => {
  it.each(
    fixtures.map((cards, index) => ({
      cards,
      expected: CATEGORIES[index],
      index,
    })),
  )("recognizes $expected", ({ cards, expected, index }) => {
    expect(hand(cards).category).toBe(expected);
    expect(hand(cards).categoryRank).toBe(index);
    expect(hand(cards).bestFive).toHaveLength(5);
    expect(hand(cards).description.length).toBeGreaterThan(10);
  });
  it("orders all nine categories strictly", () => {
    for (let i = 1; i < fixtures.length; i++)
      expect(
        compareHands(hand(fixtures[i]), hand(fixtures[i - 1])),
      ).toBeGreaterThan(0);
  });
  it("recognizes royal flush as ace-high straight flush", () => {
    expect(hand("As Ks Qs Js Ts").tuple).toEqual([8, 14]);
    expect(hand("As Ks Qs Js Ts").description).toContain("Royal flush");
  });
  it("recognizes wheel as five high and ace-high broadway as ace high", () => {
    expect(hand("As 2d 3h 4c 5s").tuple).toEqual([4, 5]);
    expect(hand("As Kd Qh Jc Ts").tuple).toEqual([4, 14]);
    expect(
      compareHands(hand("2s 3d 4h 5c 6s"), hand("As 2d 3h 4c 5s")),
    ).toBeGreaterThan(0);
    expect(hand("As 2s 3s 4s 5s").tuple).toEqual([8, 5]);
    expect(hand("Qs Kd Ah 2c 3s").category).toBe("High Card");
  });
  it("compares full houses by trips before pair", () => {
    expect(
      compareHands(hand("Ks Kd Kh 2c 2s"), hand("Qs Qd Qh Ac As")),
    ).toBeGreaterThan(0);
    expect(
      compareHands(hand("Ks Kd Kh 3c 3s"), hand("Ks Kd Kh 2c 2s")),
    ).toBeGreaterThan(0);
    expect(
      compareHands(hand("2s 2d 2h 3c 3s"), hand("As Js 9s 7s 3s")),
    ).toBeGreaterThan(0);
  });
  it("compares four-of-a-kind kickers, then two-pair ranks and kicker", () => {
    expect(
      compareHands(hand("Ks Kd Kh Kc As"), hand("Ks Kd Kh Kc Qs")),
    ).toBeGreaterThan(0);
    expect(
      compareHands(hand("As Ad 2c 2h 3s"), hand("Ks Kd Qc Qh Js")),
    ).toBeGreaterThan(0);
    expect(
      compareHands(hand("As Ad 3c 3h 2s"), hand("As Ad 2c 2h Ks")),
    ).toBeGreaterThan(0);
    expect(
      compareHands(hand("As Ad 2c 2h Ks"), hand("As Ad 2c 2h Qs")),
    ).toBeGreaterThan(0);
  });
  it("compares every kicker for pair, trips, high card and flush", () => {
    expect(
      compareHands(hand("As Ad Kc Qh Js"), hand("As Ad Kc Qh Ts")),
    ).toBeGreaterThan(0);
    expect(
      compareHands(hand("As Ad Ah Kc Qs"), hand("As Ad Ah Kc Js")),
    ).toBeGreaterThan(0);
    expect(
      compareHands(hand("As Kd Qc 9h 4s"), hand("As Kd Qc 9h 3s")),
    ).toBeGreaterThan(0);
    expect(
      compareHands(hand("As Ks Qs 9s 4s"), hand("Ah Kh Qh 9h 3h")),
    ).toBeGreaterThan(0);
    expect(compareHands(hand("As Ks Qs 9s 4s"), hand("Ah Kh Qh 9h 4h"))).toBe(
      0,
    );
  });
  it("rejects duplicate, mismatched identity and incomplete inputs", () => {
    const cards = parseCards("As Kd Qc Jh 9s");
    expect(() => evaluate([...cards, cards[0]])).toThrow(/Duplicate/);
    expect(() => evaluate(cards.slice(0, 4))).toThrow(/five, six or seven/);
    expect(() => evaluate(parseCards("As Kd Qc Jh 9s 8h 7h 6h"))).toThrow();
    expect(() =>
      evaluate([{ ...cards[0], id: "Ks" }, ...cards.slice(1)]),
    ).toThrow(/Invalid/);
  });
});

describe("best five of six or seven", () => {
  it("enumerates each combination exactly once", () => {
    const choices = combinations(parseCards("As Kd Qc Jh 9s 8h 7h"), 5);
    expect(choices).toHaveLength(21);
    expect(
      new Set(choices.map((choice) => choice.map((card) => card.id).join(",")))
        .size,
    ).toBe(21);
    expect(combinations([1, 2], 0)).toEqual([[]]);
    expect(() => combinations([1], 2)).toThrow();
  });
  it("finds straight flush among distracting cards", () => {
    expect(hand("As Ks Qs Js Ts Ac Ah").tuple).toEqual([8, 14]);
    expect(
      hand("As Ks Qs Js Ts Ac")
        .bestFive.map((card) => card.id)
        .sort(),
    ).toEqual(["As", "Js", "Ks", "Qs", "Ts"]);
  });
  it("selects highest trips for full house when two trips exist", () => {
    expect(hand("As Ad Ah Ks Kd Kh 2c").tuple).toEqual([6, 14, 13]);
    expect(hand("As Ad Ah Ks Kd Qh Qc").tuple).toEqual([6, 14, 13]);
  });
  it("accepts equivalent five-card optimal combinations by tuple equality", () => {
    const best = hand("As Ad Kc Qh Js Tc 2h");
    expect(compareHands(hand("As Kc Qh Js Tc"), best)).toBe(0);
    expect(compareHands(hand("Ad Kc Qh Js Tc"), best)).toBe(0);
  });
  it("ties exactly when the shared board supplies all five", () => {
    const board = "As Ks Qs Js Ts";
    expect(compareHands(hand(`${board} 2h 3c`), hand(`${board} Ah Ad`))).toBe(
      0,
    );
  });
});
