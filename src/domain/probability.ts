import { validateCards } from "./cards";
import type { Deck } from "./types";

/** Conditional on visible cards only: hidden hands and burns stay unseen. */
export function nextAceProbability(known: Deck): {
  aces: number;
  unseen: number;
  percent: number;
} {
  if (known.length > 7) throw new Error("Use zero through seven known cards.");
  validateCards(known);
  const aces = 4 - known.filter((card) => card.rank === 14).length;
  const unseen = 52 - known.length;
  return { aces, unseen, percent: (aces / unseen) * 100 };
}
