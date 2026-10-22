import { memoryAdjustment, type PublicMemory } from "./publicMemory";
import { evaluate } from "../evaluation";
import type { RandomSource } from "../types";
import type { NpcObservation } from "./observation";
import type { Action } from "./types";

function randomValue(random?: RandomSource): number {
  const v = random
    ? random()
    : crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296;
  return Number.isFinite(v) && v >= 0 && v < 1 ? v : 0.5;
}
const clamp = (n: number) => Math.max(0, Math.min(1, n));
/** Approximation, not solver equity. Uses only observed cards and public information. */
function strength(o: NpcObservation): number {
  const [a, b] = o.privateCards;
  if (!a || !b) return 0.25;
  if (o.board.length === 0) {
    const high = Math.max(a.rank, b.rank),
      low = Math.min(a.rank, b.rank);
    return clamp(
      0.12 +
        (high + low) / 56 +
        (a.rank === b.rank ? 0.25 : 0) +
        (a.suit === b.suit ? 0.05 : 0) +
        (high - low <= 2 ? 0.035 : 0) -
        (high - low > 5 ? 0.07 : 0),
    );
  }
  const hand = evaluate([...o.privateCards, ...o.board]);
  const levels = [0.17, 0.43, 0.61, 0.72, 0.8, 0.87, 0.93, 0.98, 1];
  let score = levels[hand.categoryRank] + (hand.tieBreakers[0] - 8) * 0.009;
  if (o.board.length >= 5) {
    const board = evaluate([...o.board]);
    if (board.categoryRank === hand.categoryRank) score -= 0.13;
  }
  if (o.difficulty !== "beginner") {
    const visible = [...o.privateCards, ...o.board];
    if (o.board.length < 5) {
      if (
        ["clubs", "diamonds", "hearts", "spades"].some(
          (s) => visible.filter((c) => c.suit === s).length === 4,
        )
      )
        score += 0.09;
      const ranks = new Set<number>(visible.map((c) => c.rank));
      if (ranks.has(14)) ranks.add(1);
      for (let start = 1; start <= 10; start++)
        if (
          Array.from({ length: 5 }, (_, i) => ranks.has(start + i)).filter(
            Boolean,
          ).length === 4
        ) {
          score += 0.05;
          break;
        }
    }
    if (o.difficulty === "challenge") {
      const opponents = o.participants.filter(
        (p) => p.id !== o.playerId && p.inHand && !p.folded,
      ).length;
      score -= Math.max(0, opponents - 1) * 0.035;
      const raises = o.actions.filter(
        (a) =>
          a.street === o.street &&
          (a.type === "RAISE" || a.type === "BET" || a.type === "ALL_IN"),
      ).length;
      score -= Math.min(0.12, raises * 0.03);
      const boardRanks = o.board.map((c) => c.rank);
      if (new Set(boardRanks).size < boardRanks.length && hand.categoryRank < 3)
        score -= 0.04;
    }
  }
  return clamp(score);
}
/** Safe fallback accepts no hidden state. The controller also validates through the engine. */
export function safeNpcAction(o: NpcObservation, candidate: unknown): Action {
  const l = o.legal;
  if (
    candidate &&
    typeof candidate === "object" &&
    "type" in candidate &&
    "playerId" in candidate &&
    candidate.playerId === o.playerId
  ) {
    const a = candidate as Action;
    if (
      (a.type === "CHECK" && l.check) ||
      (a.type === "CALL" && l.call > 0) ||
      (a.type === "FOLD" && l.fold) ||
      (a.type === "ALL_IN" && l.allIn)
    )
      return a;
    if (
      ((a.type === "BET" && l.bet) || (a.type === "RAISE" && l.raise)) &&
      "to" in a &&
      Number.isSafeInteger(a.to) &&
      a.to >= l.minTo &&
      a.to <= l.maxTo
    )
      return a;
  }
  if (l.check) return { type: "CHECK", playerId: o.playerId };
  if (l.fold) return { type: "FOLD", playerId: o.playerId };
  throw new Error("NPC has no legal fallback; controller must pause");
}
export function chooseNpcAction(
  o: NpcObservation,
  random?: RandomSource,
  memory?: PublicMemory,
): Action {
  const profile = {
    cautious: { aggression: 0.28, loose: -0.1, noise: 0.08 },
    aggressive: { aggression: 0.76, loose: 0.09, noise: 0.13 },
    casual: { aggression: 0.44, loose: 0.05, noise: 0.38 },
    analytical: { aggression: 0.48, loose: 0, noise: 0.035 },
  }[o.personality];
  const l = o.legal;
  const noise =
    profile.noise +
    (o.difficulty === "beginner"
      ? 0.22
      : o.difficulty === "standard"
        ? 0.08
        : 0);
  let score = clamp(
    strength(o) + profile.loose + (o.difficulty === "beginner" ? 0 : memoryAdjustment(memory, o.playerId, o.participants.filter((p) => p.inHand && !p.folded).map((p) => p.id))) + (randomValue(random) - 0.5) * noise * 2,
  );
  const cost = l.call / Math.max(1, o.pot + l.call);
  if (o.difficulty === "challenge") {
    const remaining = o.participants.filter((p) => p.inHand && !p.folded);
    const position =
      (o.participants.find((p) => p.id === o.playerId)!.seat -
        o.dealer +
        o.participants.length) %
      o.participants.length;
    score = clamp(
      score +
        (position === 0 ? 0.03 : 0) -
        Math.max(0, remaining.length - 2) * 0.015 -
        (l.call > o.stack * 0.45 ? 0.035 : 0),
    );
  }
  const roll = randomValue(random);
  let candidate: Action;
  if (l.call > 0 && score < 0.22 + cost * 0.55 && roll > 0.08)
    candidate = { type: "FOLD", playerId: o.playerId };
  else if (
    (l.raise || l.bet) &&
    roll <
      profile.aggression * (score > 0.65 ? 0.85 : score > 0.42 ? 0.48 : 0.11)
  ) {
    const size =
      l.minTo +
      Math.floor(
        Math.max(0, o.pot) *
          ((score > 0.8 ? 0.85 : 0.25) + randomValue(random) * 0.5),
      );
    candidate = {
      type: l.bet ? "BET" : "RAISE",
      playerId: o.playerId,
      to: Math.min(l.maxTo, size),
    };
  } else if (
    l.allIn &&
    l.allInKind === "short-raise" &&
    score > 0.62 &&
    roll < profile.aggression
  )
    candidate = { type: "ALL_IN", playerId: o.playerId };
  else candidate = { type: l.check ? "CHECK" : "CALL", playerId: o.playerId };
  return safeNpcAction(o, candidate);
}
