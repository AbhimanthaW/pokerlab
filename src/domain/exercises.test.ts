import { describe, expect, it } from "vitest";
import { parseCards, seededRandom } from "./cards";
import { evaluate } from "./evaluation";
import { generateExercise, gradeExercise } from "./exercises";
import type { Exercise } from "./types";
function exercise(
  kind: Exercise["kind"],
  cards: string,
  otherCards?: string,
): Exercise {
  return {
    id: "fixture",
    kind,
    cards: parseCards(cards),
    otherCards: otherCards ? parseCards(otherCards) : undefined,
    prompt: "Test",
  };
}
describe("exercise grading", () => {
  const pair = exercise("recognition", "As Ah Kd 9h 3c");
  it("grades categories using the evaluator", () => {
    expect(
      gradeExercise(pair, { type: "category", category: "One Pair" }).status,
    ).toBe("correct");
    const incorrect = gradeExercise(pair, {
      type: "category",
      category: "Two Pair",
    });
    expect(incorrect.status).toBe("incorrect");
    expect(incorrect.expectedCategory).toBe("One Pair");
    expect(incorrect.explanation).toContain("Two Pair");
  });
  it("records skips separately and provides the solution", () => {
    const skipped = gradeExercise(pair, { type: "skip" });
    expect(skipped.status).toBe("skipped");
    expect(skipped.explanation).toContain("does not count against accuracy");
    expect(skipped.expectedCategory).toBe("One Pair");
  });
  it("accepts any equivalent optimal five-card selection", () => {
    const fullHouse = exercise("best-five", "As Ah Ad Ks Kh Kd 2c");
    const a = parseCards("As Ah Ad Ks Kh").map((card) => card.id);
    const b = parseCards("As Ah Ad Kh Kd").map((card) => card.id);
    expect(
      gradeExercise(fullHouse, { type: "selection", cardIds: a }).status,
    ).toBe("correct");
    expect(
      gradeExercise(fullHouse, { type: "selection", cardIds: b }).status,
    ).toBe("correct");
    expect(
      gradeExercise(fullHouse, {
        type: "selection",
        cardIds: parseCards("Ks Kh Kd As Ah").map((card) => card.id),
      }).status,
    ).toBe("incorrect");
  });
  it("rejects incomplete, duplicate, and foreign selections", () => {
    const best = exercise("best-five", "As Ah Ad Ks Kh Kd 2c");
    expect(
      gradeExercise(best, {
        type: "selection",
        cardIds: best.cards.slice(0, 4).map((c) => c.id),
      }).status,
    ).toBe("incorrect");
    expect(
      gradeExercise(best, {
        type: "selection",
        cardIds: Array(5).fill(best.cards[0].id),
      }).status,
    ).toBe("incorrect");
    expect(
      gradeExercise(best, {
        type: "selection",
        cardIds: parseCards("As Ah Ad Ks Qh").map((c) => c.id),
      }).status,
    ).toBe("incorrect");
  });
  it("grades exact ties and explains that suits do not rank", () => {
    const tie = exercise("comparison", "As Kd Qh Jc Ts", "Ah Kc Qd Js Th");
    const result = gradeExercise(tie, { type: "comparison", winner: "tie" });
    expect(result.status).toBe("correct");
    expect(result.explanation).toContain("exact tie");
    expect(gradeExercise(tie, { type: "comparison", winner: "a" }).status).toBe(
      "incorrect",
    );
  });
  it("uses kickers when categories match and handles either winner", () => {
    const a = exercise("comparison", "As Ah Kd 9c 2d", "Ac Ad Qs Jh 8s");
    expect(gradeExercise(a, { type: "comparison", winner: "a" }).status).toBe(
      "correct",
    );
    const b = exercise("comparison", "2s 2h 4c 7h 9s", "As Ah 3d 6c 8s");
    expect(gradeExercise(b, { type: "comparison", winner: "b" }).status).toBe(
      "correct",
    );
  });
  it("rejects a mismatched answer type instead of silently grading", () => {
    expect(() =>
      gradeExercise(pair, { type: "comparison", winner: "a" }),
    ).toThrow();
  });
});
describe("problem generation", () => {
  for (const difficulty of ["beginner", "standard", "challenge"] as const) {
    for (const kind of ["recognition", "best-five", "comparison"] as const) {
      it(`generates legal ${difficulty} ${kind} problems and grades their solutions`, () => {
        const random = seededRandom(9183);
        const signatures = new Set<string>();
        for (let i = 0; i < 60; i++) {
          const problem = generateExercise(kind, difficulty, random);
          const all = [...problem.cards, ...(problem.otherCards ?? [])];
          expect(new Set(all.map((c) => c.id)).size).toBe(all.length);
          signatures.add(problem.cards.map((c) => c.id).join());
          const hand = evaluate(problem.cards);
          if (kind === "best-five") {
            expect(problem.cards.length).toBe(7);
            expect(
              gradeExercise(problem, {
                type: "selection",
                cardIds: hand.bestFive.map((c) => c.id),
              }).status,
            ).toBe("correct");
          }
          if (kind === "recognition")
            expect(
              gradeExercise(problem, {
                type: "category",
                category: hand.category,
              }).status,
            ).toBe("correct");
          if (kind === "comparison")
            expect(problem.otherCards?.length).toBeGreaterThanOrEqual(5);
          expect(gradeExercise(problem, { type: "skip" }).status).toBe(
            "skipped",
          );
        }
        expect(signatures.size).toBeGreaterThan(5);
      });
    }
  }
  it("rejects invalid injected randomness", () => {
    expect(() =>
      generateExercise("recognition", "standard", () => 1),
    ).toThrow();
    expect(() =>
      generateExercise("recognition", "standard", () => -1),
    ).toThrow();
  });
});
