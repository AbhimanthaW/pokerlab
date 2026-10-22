import { validateCards } from "./cards";
import { CATEGORIES, type Card, type Deck, type EvaluatedHand } from "./types";

const names: Record<number, string> = {
  2: "two",
  3: "three",
  4: "four",
  5: "five",
  6: "six",
  7: "seven",
  8: "eight",
  9: "nine",
  10: "ten",
  11: "jack",
  12: "queen",
  13: "king",
  14: "ace",
};
const plurals: Record<number, string> = {
  2: "twos",
  3: "threes",
  4: "fours",
  5: "fives",
  6: "sixes",
  7: "sevens",
  8: "eights",
  9: "nines",
  10: "tens",
  11: "jacks",
  12: "queens",
  13: "kings",
  14: "aces",
};

export function combinations<T>(items: readonly T[], count: number): T[][] {
  if (!Number.isInteger(count) || count < 0 || count > items.length)
    throw new Error("Invalid combination size.");
  const result: T[][] = [];
  function visit(start: number, chosen: T[]): void {
    if (chosen.length === count) {
      result.push([...chosen]);
      return;
    }
    for (let i = start; i <= items.length - (count - chosen.length); i++) {
      chosen.push(items[i]);
      visit(i + 1, chosen);
      chosen.pop();
    }
  }
  visit(0, []);
  return result;
}

/** Positive means a is stronger. Category is the first tuple component. */
export function compareHands(a: EvaluatedHand, b: EvaluatedHand): number {
  for (let i = 0; i < Math.max(a.tuple.length, b.tuple.length); i++) {
    const difference = (a.tuple[i] ?? 0) - (b.tuple[i] ?? 0);
    if (difference) return difference;
  }
  return 0;
}

function describe(category: number, tie: number[]): string {
  const kickers = (values: number[]) =>
    values.map((rank) => names[rank]).join(", ");
  switch (category) {
    case 8:
      return tie[0] === 14
        ? "Royal flush — ace-high straight flush. All royal flushes tie; suits never break ties."
        : `${names[tie[0]]}-high straight flush. Compare its highest card; suits never break ties.`;
    case 7:
      return `Four ${plurals[tie[0]]}, ${names[tie[1]]} kicker. Compare the four-of-a-kind rank, then the kicker.`;
    case 6:
      return `${plurals[tie[0]]} full of ${plurals[tie[1]]}. Compare the three-of-a-kind rank first, then the pair.`;
    case 5:
      return `${names[tie[0]]}-high flush (${kickers(tie)}). Compare all five ranks in descending order; suits never break ties.`;
    case 4:
      return `${names[tie[0]]}-high straight${tie[0] === 5 ? " (ace counts as one)" : ""}. Only the highest card breaks a straight tie.`;
    case 3:
      return `Three ${plurals[tie[0]]}, ${kickers(tie.slice(1))} kickers. Compare the trips, then each kicker.`;
    case 2:
      return `Two pair, ${plurals[tie[0]]} and ${plurals[tie[1]]}, ${names[tie[2]]} kicker. Compare the higher pair, lower pair, then kicker.`;
    case 1:
      return `Pair of ${plurals[tie[0]]}, ${kickers(tie.slice(1))} kickers. Compare the pair, then each kicker in order.`;
    default:
      return `${names[tie[0]]}-high (${kickers(tie)}). Compare the five ranks in descending order.`;
  }
}

function evaluateFive(cards: readonly Card[]): EvaluatedHand {
  const sorted = [...cards].sort(
    (a, b) => b.rank - a.rank || a.id.localeCompare(b.id),
  );
  const ranks = sorted.map((card) => card.rank);
  const counts = new Map<number, number>();
  for (const rank of ranks) counts.set(rank, (counts.get(rank) ?? 0) + 1);
  const groups = [...counts].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  const unique = [...counts.keys()].sort((a, b) => b - a);
  const flush = sorted.every((card) => card.suit === sorted[0].suit);
  const wheel = unique.join(",") === "14,5,4,3,2";
  const straight =
    unique.length === 5 && (unique[0] - unique[4] === 4 || wheel);
  const straightHigh = wheel ? 5 : unique[0];
  let category: number;
  let tie: number[];
  if (straight && flush) {
    category = 8;
    tie = [straightHigh];
  } else if (groups[0][1] === 4) {
    category = 7;
    tie = [groups[0][0], groups[1][0]];
  } else if (groups[0][1] === 3 && groups[1][1] === 2) {
    category = 6;
    tie = [groups[0][0], groups[1][0]];
  } else if (flush) {
    category = 5;
    tie = ranks;
  } else if (straight) {
    category = 4;
    tie = [straightHigh];
  } else if (groups[0][1] === 3) {
    category = 3;
    tie = groups.map((group) => group[0]);
  } else if (groups[0][1] === 2 && groups[1][1] === 2) {
    category = 2;
    tie = groups.map((group) => group[0]);
  } else if (groups[0][1] === 2) {
    category = 1;
    tie = groups.map((group) => group[0]);
  } else {
    category = 0;
    tie = ranks;
  }
  return {
    category: CATEGORIES[category],
    categoryRank: category,
    tuple: [category, ...tie],
    tieBreakers: [...tie],
    bestFive: sorted,
    description: describe(category, tie),
  };
}

export function evaluate(cards: Deck): EvaluatedHand {
  if (cards.length < 5 || cards.length > 7)
    throw new Error("Evaluate exactly five, six or seven cards.");
  validateCards(cards);
  const candidates = combinations(cards, 5).map(evaluateFive);
  return candidates.reduce((best, hand) =>
    compareHands(hand, best) > 0 ? hand : best,
  );
}
