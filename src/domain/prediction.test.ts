import { describe, expect, it } from "vitest";
import { createDeck, parseCards, removeCards } from "./cards";
import { gameReducer, initialGame } from "./game";
import { gradePrediction } from "./prediction";
import type { GameState } from "./types";

const river = (prefix: string): GameState => {
  const cards = parseCards(prefix);
  let state = gameReducer(initialGame, {
    type: "START",
    opponents: 1,
    deck: [...cards, ...removeCards(createDeck(), cards)],
  });
  for (let i = 0; i < 3; i++) state = gameReducer(state, { type: "ADVANCE" });
  return state;
};
const decisive = () => river("Ah Kh Ad Kd 2c As 3d 7h 4c 9s 5c Jd");
const tied = () => river("2h 3h 4h 5h 6c As Ks Qs 7c Js 8c Ts");

describe("showdown prediction grading", () => {
  it("evaluates actual hands rather than trusting stale winner metadata", () => {
    const game = { ...decisive(), winners: ["opponent-1"] };
    expect(
      gradePrediction(game, { type: "prediction", winner: "you" }).status,
    ).toBe("correct");
    const wrong = gradePrediction(game, {
      type: "prediction",
      winner: "opponent-1",
    });
    expect(wrong.status).toBe("incorrect");
    expect(wrong.explanation).toContain("You have Three aces");
    expect(wrong.expectedCategory).toBe("Three of a Kind");
    expect(game.phase).toBe("river");
    expect(game.results).toEqual([]);
  });
  it("accepts tie prediction and rejects any single winner when strongest hands tie", () => {
    const game = tied();
    expect(
      gradePrediction(game, { type: "prediction", winner: "tie" }).status,
    ).toBe("correct");
    expect(
      gradePrediction(game, { type: "prediction", winner: "you" }).status,
    ).toBe("incorrect");
    expect(
      gradePrediction(game, { type: "prediction", winner: "tie" }).explanation,
    ).toContain("You and Alex tie with Royal flush");
  });
  it("distinguishes skipped predictions without marking them incorrect", () => {
    const result = gradePrediction(decisive(), { type: "skip" });
    expect(result.status).toBe("skipped");
    expect(result.explanation).toContain("Prediction skipped");
    expect(result.explanation).toContain("incomplete information");
  });
  it("rejects non-river phases, incomplete states, duplicate cards, and invalid answers", () => {
    expect(() => gradePrediction(initialGame, { type: "skip" })).toThrow(
      /river/,
    );
    const game = decisive();
    expect(() =>
      gradePrediction(
        { ...game, phase: "showdown" },
        { type: "prediction", winner: "you" },
      ),
    ).toThrow(/river/);
    expect(() =>
      gradePrediction(
        { ...game, community: game.community.slice(1) },
        { type: "skip" },
      ),
    ).toThrow(/complete/);
    expect(() =>
      gradePrediction({ ...game, players: [] }, { type: "skip" }),
    ).toThrow(/complete/);
    expect(() =>
      gradePrediction(
        {
          ...game,
          community: [...game.community.slice(0, 4), game.players[0].cards[0]],
        },
        { type: "skip" },
      ),
    ).toThrow(/Duplicate/);
    expect(() =>
      gradePrediction(game, { type: "prediction", winner: "nonexistent" }),
    ).toThrow(/Choose/);
    expect(() =>
      gradePrediction(game, { type: "comparison", winner: "a" }),
    ).toThrow(/Choose/);
  });
});
