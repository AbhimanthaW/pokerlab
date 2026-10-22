import { createDeck, parseCards, shuffle } from "./cards";
import { uniqueId } from "./id";
import { compareHands, evaluate } from "./evaluation";
import type {
  Answer,
  Card,
  Difficulty,
  EvaluationResult,
  Exercise,
  ExerciseKind,
  RandomSource,
} from "./types";

type TrainerKind = Exclude<ExerciseKind, "prediction">;
const beginner = [
  "As Kd 9h 6c 3d",
  "As Ah Kd 9h 3c",
  "Ks Kh 8d 8c 2h",
  "Qs Qh Qd 8c 3s",
  "9s 8d 7h 6c 5d",
  "Ah Jh 8h 5h 2h",
  "Ks Kd Kh 4s 4d",
  "9c 9d 9h 9s As",
  "Js Ts 9s 8s 7s",
];
const standard = [
  "As Ah Kd 9h 3c 4s 7d",
  "Ks Kh 8d 8c 2h 3d Ad",
  "Qs Qh Qd 8c 3s 9d Ah",
  "9s 8d 7h 6c 5d Kh 2c",
  "Ah Jh 8h 5h 2h Kd Qc",
  "Ks Kd Kh 4s 4d Ac 2h",
  "9c 9d 9h 9s As Kd 2c",
  "Js Ts 9s 8s 7s Ah 2d",
];
const challenge = [
  "As 2d 3h 4c 5d Kc Qh",
  "As Ah Ad Ks Kh Kd 2c",
  "Ah Jh 9h 8h 6h 4h 2h",
  "As Ac Kd Kh Qs Qc Jd",
  "9c 9d 9h 9s As Ah Kc",
  "As Ks Qs Js Ts 9s 2d",
  "2s 2h 3s 3h 3d 2d Ac",
  "9s 8s 7s 6s 5s 4s 3s",
];
const comparisonFixtures = [
  ["As Kd Qh Jc Ts", "Ah Kc Qd Js Th"],
  ["As Ah Kd 8c 3s", "Ac Ad Qd Jh 9s"],
  ["Ks Kh 8d 8c As", "Kc Kd 8h 8s Qh"],
  ["Qs Qh Qd Ac Ad", "Ks Kh Kd 2c 2d"],
  ["Ah Jh 9h 7h 3h", "As Js 9s 7s 2s"],
  ["As 2d 3h 4c 5d", "2s 3d 4h 5c 6d"],
  ["As Ah 7d 5c 3s", "Ac Ad 7h 5d 3c"],
  ["9c 9d 9h 9s Ac", "Tc Td Th Ts 2c"],
];
const beginnerComparisons = [
  ["As Ah Kd 8c 3s", "Kc Qh Jd 9c 2h"],
  ["Ks Kh 8d 8c As", "Qs Qd Jh 7c 2s"],
  ["Qs Qh Qd Ac 4d", "Ks Kh 9c 9d 2h"],
  ["Ah Jh 9h 7h 3h", "9s 8d 7s 6c 5d"],
  ["As Kd 9h 6c 3d", "Ah Kc 9d 6s 3c"],
];
const challengeComparisons = [
  ["As Ah Ad Ks Kh Kd 2c", "Qs Qh Qd Js Jh Jd 3c"],
  ["As Ks Qs Js Ts 9d 2c", "Ah Kh Qh Jh Th 8d 3c"],
  ["9c 9d 9h 9s As Ah Kc", "Tc Td Th Ts Ac Ad Qc"],
  ["Ks Kh 8d 8c As 3d 2h", "Kc Kd 8h 8s Qh 4d 2s"],
  ["As Ac Kd Kh Qs Qc Jd", "Ah Ad Ks Kc Jh Jc 2d"],
  ["As 2d 3h 4c 5d Qc 9h", "2s 3d 4h 5c 6d Js 8c"],
];
function randomValue(random?: RandomSource): number {
  const n = random
    ? random()
    : crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296;
  if (!Number.isFinite(n) || n < 0 || n >= 1)
    throw new Error("Random source must return a value in [0, 1).");
  return n;
}
function choose<T>(items: readonly T[], random?: RandomSource): T {
  return items[Math.floor(randomValue(random) * items.length)];
}
/** Fixtures teach rare cases; shuffled decks supply varied, legal scenarios. */
export function generateExercise(
  kind: TrainerKind,
  difficulty: Difficulty,
  random?: RandomSource,
): Exercise {
  let cards: Card[];
  let otherCards: Card[] | undefined;
  const curated =
    randomValue(random) <
    (difficulty === "challenge"
      ? 0.85
      : difficulty === "beginner"
        ? 0.8
        : 0.45);
  if (kind === "comparison" && curated) {
    const fixture = choose(
      difficulty === "beginner"
        ? beginnerComparisons
        : difficulty === "challenge"
          ? challengeComparisons
          : comparisonFixtures,
      random,
    );
    [cards, otherCards] = fixture.map(parseCards);
    if (randomValue(random) < 0.5) [cards, otherCards] = [otherCards, cards];
  } else if (curated) {
    const examples =
      difficulty === "challenge"
        ? challenge
        : kind === "best-five" || difficulty === "standard"
          ? standard
          : beginner;
    cards = shuffle(parseCards(choose(examples, random)), random);
  } else {
    const deck = shuffle(createDeck(), random);
    const count = kind === "best-five" || difficulty !== "beginner" ? 7 : 5;
    cards = deck.slice(0, count);
    if (kind === "comparison") otherCards = deck.slice(count, count * 2);
  }
  return {
    id: uniqueId(),
    kind,
    cards,
    otherCards,
    prompt:
      kind === "recognition"
        ? "What is the strongest hand you can make?"
        : kind === "best-five"
          ? "Choose the strongest five cards."
          : "Which hand is stronger?",
  };
}
function details(cards: Card[]): string {
  const hand = evaluate(cards);
  return `${hand.description}. Compare the category first, then the relevant ranks in order. Suits never break a tie.`;
}
export function gradeExercise(
  exercise: Exercise,
  answer: Answer,
): EvaluationResult {
  const hand = evaluate(exercise.cards);
  const other =
    exercise.kind === "comparison" && exercise.otherCards
      ? evaluate(exercise.otherCards)
      : null;
  const strongest = other && compareHands(other, hand) > 0 ? other : hand;
  const solution = {
    expectedCategory: strongest.category,
    bestFive: strongest.bestFive,
  };
  if (answer.type === "skip")
    return {
      ...solution,
      status: "skipped",
      explanation: `Skipped; this does not count against accuracy. ${exercise.kind === "comparison" && exercise.otherCards ? comparisonExplanation(exercise) : details(exercise.cards)}`,
    };
  if (exercise.kind === "recognition" && answer.type === "category") {
    const correct = answer.category === hand.category;
    return {
      ...solution,
      status: correct ? "correct" : "incorrect",
      explanation: `${correct ? "Correct." : `You chose ${answer.category}; the best category is ${hand.category}.`} ${details(exercise.cards)}`,
    };
  }
  if (exercise.kind === "best-five" && answer.type === "selection") {
    const selected = exercise.cards.filter((card) =>
      answer.cardIds.includes(card.id),
    );
    if (
      answer.cardIds.length !== 5 ||
      new Set(answer.cardIds).size !== 5 ||
      selected.length !== 5
    ) {
      return {
        ...solution,
        status: "incorrect",
        explanation: `Select exactly five distinct cards from the available cards. The strongest hand is ${hand.description}.`,
      };
    }
    const selectedHand = evaluate(selected);
    const correct = compareHands(selectedHand, hand) === 0;
    return {
      ...solution,
      status: correct ? "correct" : "incorrect",
      explanation: `${correct ? "Correct. Your five cards are an optimal selection; equally strong alternatives are accepted." : `Your selection makes ${selectedHand.description}. The strongest selection makes ${hand.description}.`} ${details(exercise.cards)}`,
    };
  }
  if (
    exercise.kind === "comparison" &&
    answer.type === "comparison" &&
    exercise.otherCards
  ) {
    const compared = compareHands(hand, evaluate(exercise.otherCards));
    const winner = compared === 0 ? "tie" : compared > 0 ? "a" : "b";
    return {
      ...solution,
      status: answer.winner === winner ? "correct" : "incorrect",
      explanation: `${answer.winner === winner ? "Correct." : "Look again at the category and tie breakers."} ${comparisonExplanation(exercise)}`,
    };
  }
  throw new Error("Answer does not match this exercise.");
}
function comparisonExplanation(exercise: Exercise): string {
  if (!exercise.otherCards) throw new Error("Comparison requires two hands.");
  const a = evaluate(exercise.cards);
  const b = evaluate(exercise.otherCards);
  const comparison = compareHands(a, b);
  return `Hand A: ${a.description}. Hand B: ${b.description}. ${comparison === 0 ? "This is an exact tie: all five relevant ranks match. Suits do not decide a winner." : `Hand ${comparison > 0 ? "A" : "B"} wins. ${a.categoryRank === b.categoryRank ? `Both have ${a.category}; compare their tie-breaker ranks in order (${a.tieBreakers.join(", ")} versus ${b.tieBreakers.join(", ")}; Ace = 14).` : `${comparison > 0 ? a.category : b.category} ranks above ${comparison > 0 ? b.category : a.category}.`}`}`;
}
