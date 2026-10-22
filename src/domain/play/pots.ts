import { compareHands, evaluate } from "../evaluation";
import { validateCards } from "../cards";
import type { Card } from "../types";
import type { PotAward, PotLayer } from "./types";

export interface Contributor {
  id: string;
  committed: number;
  folded: boolean;
  cards: Card[];
}
/** Layers include folded money. A layer with one contributor is an uncalled refund. */
export function buildPots(players: readonly Contributor[]): {
  pots: PotLayer[];
  refunds: Record<string, number>;
} {
  if (
    new Set(players.map((p) => p.id)).size !== players.length ||
    players.some((p) => !Number.isSafeInteger(p.committed) || p.committed < 0)
  )
    throw new Error("Invalid pot contributions");
  const levels = [
    ...new Set(players.map((p) => p.committed).filter((n) => n > 0)),
  ].sort((a, b) => a - b);
  let previous = 0;
  const pots: PotLayer[] = [];
  const refunds: Record<string, number> = {};
  for (const level of levels) {
    const contributors = players.filter((p) => p.committed >= level);
    const amount = (level - previous) * contributors.length;
    previous = level;
    if (contributors.length === 1) {
      refunds[contributors[0].id] = (refunds[contributors[0].id] ?? 0) + amount;
      continue;
    }
    const eligible = contributors.filter((p) => !p.folded).map((p) => p.id);
    if (!eligible.length) throw new Error("Pot has no eligible participant");
    const prior = pots.at(-1);
    if (prior && prior.eligible.join("|") === eligible.join("|")) {
      prior.amount += amount;
      prior.contributors = [
        ...new Set([...prior.contributors, ...contributors.map((p) => p.id)]),
      ];
    } else
      pots.push({
        amount,
        contributors: contributors.map((p) => p.id),
        eligible,
      });
  }
  return { pots, refunds };
}
/** Resolve each layer independently; tied odd chips go clockwise from the button. */
export function resolvePots(
  players: readonly Contributor[],
  board: Card[],
  dealer: number,
): { awards: PotAward[]; refunds: Record<string, number> } {
  if (!Number.isInteger(dealer) || dealer < 0 || dealer >= players.length)
    throw new Error("Invalid dealer position");
  validateCards([...board, ...players.flatMap((p) => p.cards)]);
  if (players.some((p) => !p.folded && p.committed > 0 && p.cards.length !== 2))
    throw new Error("A live contributor requires two private cards");
  const { pots, refunds } = buildPots(players);
  const live = players.filter((p) => !p.folded && p.cards.length === 2);
  if (live.length > 1 && board.length !== 5)
    throw new Error("Showdown requires a complete board");
  const hands = new Map(
    live.length > 1
      ? live.map((p) => [p.id, evaluate([...p.cards, ...board])])
      : [],
  );
  const awards = pots.map((pot) => {
    let winners = [...pot.eligible];
    if (winners.length > 1) {
      const best = winners.reduce((a, b) =>
        compareHands(hands.get(a)!, hands.get(b)!) >= 0 ? a : b,
      );
      winners = winners.filter(
        (id) => compareHands(hands.get(id)!, hands.get(best)!) === 0,
      );
    }
    winners.sort((a, b) => {
      const distance = (id: string) =>
        (players.findIndex((p) => p.id === id) - dealer - 1 + players.length) %
        players.length;
      return distance(a) - distance(b);
    });
    const share = Math.floor(pot.amount / winners.length);
    const payouts = Object.fromEntries(
      winners.map((id, i) => [
        id,
        share + (i < pot.amount % winners.length ? 1 : 0),
      ]),
    );
    const description = hands.get(winners[0])?.description;
    return {
      ...pot,
      winners,
      payouts,
      explanation: `${pot.amount} virtual chips awarded to ${winners.join(" & ")}${description ? ` with ${description.replace(/\.$/, "")}` : " as the only eligible hand"}. ${pot.amount % winners.length ? "Odd chips go clockwise from the dealer." : ""}`,
    };
  });
  return { awards, refunds };
}
