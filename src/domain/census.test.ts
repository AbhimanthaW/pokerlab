import { expect, it } from "vitest";
import { createDeck } from "./cards";
import { evaluate } from "./evaluation";

// Optional full finite-state audit. Independently derived combinatorial category
// counts over C(52,5) hands; this catches category overlap and missing edge cases.
it.skipIf(process.env.POKERLAB_EXHAUSTIVE !== "1")(
  "matches the exact census of all 2,598,960 five-card hands",
  () => {
    const deck = createDeck();
    const counts = Array<number>(9).fill(0);
    for (let a = 0; a < 48; a++)
      for (let b = a + 1; b < 49; b++)
        for (let c = b + 1; c < 50; c++)
          for (let d = c + 1; d < 51; d++)
            for (let e = d + 1; e < 52; e++)
              counts[
                evaluate([deck[a], deck[b], deck[c], deck[d], deck[e]])
                  .categoryRank
              ]++;
    expect(counts).toEqual([
      1302540, 1098240, 123552, 54912, 10200, 5108, 3744, 624, 40,
    ]);
  },
  120_000,
);
