import { validateCards } from "./cards";
import { compareHands, evaluate } from "./evaluation";
import type { Answer, EvaluationResult, GameState } from "./types";

/** Grade against the actual hidden hands without changing game visibility. */
export function gradePrediction(
  game: GameState,
  answer: Answer,
): EvaluationResult {
  if (game.phase !== "river")
    throw new Error("Showdown predictions can only be graded on the river.");
  if (
    game.community.length !== 5 ||
    game.players.length < 2 ||
    game.players.length > 6 ||
    game.players.some((player) => player.cards.length !== 2)
  ) {
    throw new Error(
      "A prediction requires a complete river and two private cards per player.",
    );
  }
  validateCards([
    ...game.community,
    ...game.players.flatMap((player) => player.cards),
  ]);
  if (
    answer.type !== "skip" &&
    (answer.type !== "prediction" ||
      (answer.winner !== "tie" &&
        !game.players.some((player) => player.id === answer.winner)))
  ) {
    throw new Error("Choose a participant, a tie, or skip the prediction.");
  }
  const ranked = game.players.map((player) => ({
    player,
    hand: evaluate([...player.cards, ...game.community]),
  }));
  const strongest = ranked.reduce((a, b) =>
    compareHands(a.hand, b.hand) >= 0 ? a : b,
  );
  const winners = ranked.filter(
    (result) => compareHands(result.hand, strongest.hand) === 0,
  );
  const expected = winners.length > 1 ? "tie" : winners[0].player.id;
  const names = winners.map((result) => result.player.name).join(" and ");
  const result = `${names} ${winners.length > 1 ? "tie with" : winners[0].player.id === "you" ? "have" : "has"} ${strongest.hand.description}`;
  const uncertainty =
    "Predictions use incomplete information; this result does not measure strategic skill.";
  return {
    status:
      answer.type === "skip"
        ? "skipped"
        : answer.type === "prediction" && answer.winner === expected
          ? "correct"
          : "incorrect",
    explanation: `${answer.type === "skip" ? "Prediction skipped. " : ""}${result} ${uncertainty}`,
    expectedCategory: strongest.hand.category,
  };
}
