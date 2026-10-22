import { describe, expect, it } from "vitest";
import { parseCards } from "../cards";
import { atLeastOne, choose, exactDistribution, nextCard, outcomeCount, simulateDistribution, unseenCards, wilson, type LabScenario } from "./engine";
function scenario(privateCards: string, board = "", unavailable = ""): LabScenario { return { privateCards: parseCards(privateCards), board: parseCards(board), unavailable: parseCards(unavailable) }; }
function finish<T>(run: Generator<unknown, T>): T { let step = run.next(); while (!step.done) step = run.next(); return step.value; }
describe("finite-deck mathematics", () => {
  it("uses independently derived combination counts and drawing ratios", () => {
    expect(choose(52, 5)).toBe(2598960); expect(choose(47, 2)).toBe(1081); expect(choose(10, 0)).toBe(1); expect(choose(5, 6)).toBe(0);
    const s = scenario("Ah Kh", "Qh Jh 2c");
    expect(nextCard(s, { suit: "hearts" })).toEqual({ favorable: 9, total: 47 });
    expect(nextCard(s, { rank: 14 })).toEqual({ favorable: 3, total: 47 });
    expect(atLeastOne(47, 9, 2)).toEqual({ favorable: 1081 - 703, total: 1081 });
    expect(atLeastOne(47, 9, 2).favorable / 1081).not.toBeCloseTo(1 - (38 / 47) ** 2, 4);
  });
  it("validates duplicates, card counts and known unavailable cards", () => {
    expect(unseenCards(scenario(""))).toHaveLength(52);
    expect(() => unseenCards(scenario("Ah Kh", "Ah 2c 3d"))).toThrow(/Duplicate/);
    expect(() => unseenCards(scenario("Ah Kh Qh"))).toThrow();
    expect(() => outcomeCount(scenario("Ah"))).toThrow();
    const s = scenario("Ah Kh", "Qh Jh 2c", "Th 9h");
    expect(nextCard(s, { suit: "hearts" })).toEqual({ favorable: 7, total: 45 });
    expect(outcomeCount(s)).toBe(990);
  });
  it("normalizes exact flop completions and handles ace-low straight/flush edges with the shared evaluator", () => {
    const royal = finish(exactDistribution(scenario("Ah Kh", "Qh Jh Th")));
    expect(royal.counts[8]).toBe(1081); expect(royal.counts.reduce((a, b) => a + b, 0)).toBe(royal.total);
    const wheel = finish(exactDistribution(scenario("Ah 2c", "3d 4s 5h 9c Td")));
    expect(wheel.counts[4]).toBe(1); expect(wheel.total).toBe(1);
    const turn = finish(exactDistribution(scenario("Ah Kh", "Qh Jh 2c 3d")));
    expect(turn.total).toBe(46); expect(turn.counts[5] + turn.counts[8]).toBe(9); // nine unseen hearts
    expect(turn.counts[8]).toBe(1); // ten of hearts
  });
  it("respects the exact limit and emits bounded progress", () => {
    expect(() => finish(exactDistribution(scenario("Ah Kh")))).toThrow(/exact limit/);
    const run = exactDistribution(scenario("Ah Kh", "Qh Jh 2c"));
    const step = run.next(); expect(step).toEqual({ done: false, value: { done: 100, total: 1081 } });
    expect(run.return({ method: "exact", counts: [], total: 0, possible: 1081 }).done).toBe(true);
  });
  it("reproduces seeded simulation and agrees with an independent binomial tolerance", () => {
    const s = scenario("Ah Kh", "Qh Jh 2c 3d"), a = finish(simulateDistribution(s, 3000, 42)), b = finish(simulateDistribution(s, 3000, 42));
    expect(a).toEqual(b); expect(a.counts.reduce((n, x) => n + x, 0)).toBe(3000);
    const p = 9 / 46, frequency = (a.counts[5] + a.counts[8]) / 3000;
    expect(Math.abs(frequency - p)).toBeLessThan(5 * Math.sqrt(p * (1 - p) / 3000));
    expect(finish(simulateDistribution(s, 3000, 43))).not.toEqual(a);
    for (const n of [0, 1.5, 100001]) expect(() => finish(simulateDistribution(s, n, 42))).toThrow();
  });
  it("provides Wilson intervals including zero/all-success boundary cases", () => {
    expect(wilson(0, 100)[0]).toBeCloseTo(0); expect(wilson(0, 100)[1]).toBeCloseTo(.03699, 4);
    expect(wilson(100, 100)[1]).toBeCloseTo(1); const [a, b] = wilson(50, 100); expect(a).toBeCloseTo(1 - b); expect(a).toBeCloseTo(.40383, 4);
  });
});
