import { describe, expect, it } from "vitest";
import { parseCards } from "./cards";
import { nextAceProbability } from "./probability";

describe("visible-information ace probability", () => {
  it("starts at four aces among 52 unseen cards", () => {
    expect(nextAceProbability([])).toEqual({
      aces: 4,
      unseen: 52,
      percent: (4 / 52) * 100,
    });
  });
  it("conditions only on known cards and accounts for every visible ace", () => {
    expect(nextAceProbability(parseCards("As Kd Qc Jh 9s"))).toEqual({
      aces: 3,
      unseen: 47,
      percent: (3 / 47) * 100,
    });
    expect(nextAceProbability(parseCards("As Ah Ad Ac 9s 8d 7c"))).toEqual({
      aces: 0,
      unseen: 45,
      percent: 0,
    });
    expect(nextAceProbability(parseCards("2s 3h 4d 5c 9s 8d 7c"))).toEqual({
      aces: 4,
      unseen: 45,
      percent: (4 / 45) * 100,
    });
  });
  it("rejects more than seven known cards and duplicate or invalid cards", () => {
    expect(() =>
      nextAceProbability(parseCards("2s 3h 4d 5c 9s 8d 7c As")),
    ).toThrow(/seven/);
    const ace = parseCards("As")[0];
    expect(() => nextAceProbability([ace, ace])).toThrow(/Duplicate/);
    expect(() => nextAceProbability([{ ...ace, id: "Kh" }])).toThrow(/Invalid/);
  });
});
