import { uniqueId } from "../id";
import { createDeck, shuffle, validateCards } from "../cards";
import type { Card, RandomSource } from "../types";
import { buildPots, resolvePots } from "./pots";
import {
  DEFAULT_CONFIG,
  type Action,
  type HandRecord,
  type LegalActions,
  type PlayView,
  type Seat,
  type Session,
  type SessionConfig,
} from "./types";

const profiles = ["cautious", "aggressive", "casual", "analytical"] as const;
const names = ["Alex", "Morgan", "Sam", "Robin", "Casey"];
export function assertConfig(c: SessionConfig): void {
  if (
    !Number.isInteger(c.opponents) ||
    c.opponents < 1 ||
    c.opponents > 5 ||
    c.startingStack !== 1000 ||
    c.smallBlind !== 5 ||
    c.bigBlind !== 10 ||
    !["beginner", "standard", "challenge"].includes(c.difficulty)
  )
    throw new Error("Invalid fixed-blind session configuration");
}
export function createSession(
  config: SessionConfig = DEFAULT_CONFIG,
  random?: RandomSource,
  now = Date.now(),
): Session {
  assertConfig(config);
  // Reuse the unbiased deck shuffle to draw the initial button fairly.
  const draw = shuffle(createDeck().slice(0, config.opponents + 1), random)[0];
  const dealer = draw.rank - 2;
  return {
    version: 2,
    id: uniqueId(),
    revision: 0,
    config: { ...config },
    status: "new_session",
    startedAt: now,
    finishedAt: null,
    supply: (config.opponents + 1) * config.startingStack,
    players: Array.from({ length: config.opponents + 1 }, (_, i) => ({
      id: i === 0 ? "you" : `npc-${i}`,
      name: i === 0 ? "You" : names[i - 1],
      personality: profiles[(i - 1 + 4) % 4],
      stack: config.startingStack,
      cards: [],
      folded: false,
      streetChips: 0,
      committed: 0,
      actedAt: null,
      reopenSize: config.bigBlind,
      lastAction: "",
      eliminatedHand: null,
      place: null,
    })),
    dealer,
    smallBlindSeat: -1,
    bigBlindSeat: -1,
    handNumber: 0,
    street: "preflop",
    actor: null,
    currentBet: 0,
    lastFullRaise: config.bigBlind,
    deck: [],
    board: [],
    burns: [],
    initialStacks: [],
    actions: [],
    history: [],
    winner: null,
  };
}
const liveHand = (p: Seat) => p.cards.length === 2 && !p.folded;
const canAct = (p: Seat) => liveHand(p) && p.stack > 0;
function target(s: Session, p: Seat): number {
  return s.players.filter(canAct).length === 1
    ? Math.min(
        s.currentBet,
        Math.max(
          0,
          ...s.players
            .filter((q) => q.id !== p.id && liveHand(q))
            .map((q) => q.streetChips),
        ),
      )
    : s.currentBet;
}
function nextSeat(
  s: Session,
  after: number,
  predicate: (p: Seat) => boolean,
): number {
  for (let i = 1; i <= s.players.length; i++) {
    const index = (after + i + s.players.length) % s.players.length;
    if (predicate(s.players[index])) return index;
  }
  return -1;
}
function log(
  s: Session,
  p: Seat,
  type: Session["actions"][number]["type"],
  added: number,
) {
  s.actions.push({
    sequence: s.actions.length + 1,
    street: s.street,
    playerId: p.id,
    type,
    added,
    total: p.streetChips,
  });
  p.lastAction = `${type.replaceAll("_", " ").toLowerCase()}${added ? ` +${added}` : ""}`;
}
function pay(
  s: Session,
  index: number,
  amount: number,
  type: "SMALL_BLIND" | "BIG_BLIND",
) {
  const p = s.players[index];
  const posted = Math.min(p.stack, amount);
  p.stack -= posted;
  p.committed += posted;
  p.streetChips += posted;
  log(s, p, type, posted);
}
function take(s: Session, n: number): Card[] {
  if (s.deck.length < n) throw new Error("Impossible state: exhausted deck");
  return s.deck.splice(0, n);
}
export function startHand(
  previous: Session,
  random?: RandomSource,
  testDeck?: Card[],
): Session {
  if (!["new_session", "hand_complete"].includes(previous.status))
    throw new Error("A new hand cannot start now");
  const s = structuredClone(previous);
  const surviving = s.players.filter((p) => p.stack > 0);
  if (surviving.length < 2 || s.players[0].stack === 0)
    throw new Error("Session has ended");
  if (s.handNumber > 0) {
    if (surviving.length === 2) {
      // Advance BB from its previous seat. This prevents consecutive BB on entering heads-up.
      const bb = nextSeat(s, s.bigBlindSeat, (p) => p.stack > 0);
      s.dealer = nextSeat(s, bb, (p) => p.stack > 0);
    } else s.dealer = nextSeat(s, s.dealer, (p) => p.stack > 0);
  }
  s.smallBlindSeat =
    surviving.length === 2
      ? s.dealer
      : nextSeat(s, s.dealer, (p) => p.stack > 0);
  s.bigBlindSeat = nextSeat(s, s.smallBlindSeat, (p) => p.stack > 0);
  s.status = "hand_in_progress";
  s.handNumber++;
  s.revision++;
  s.street = "preflop";
  s.actor = null;
  s.deck = testDeck ? [...testDeck] : shuffle(createDeck(), random);
  validateCards(s.deck);
  if (s.deck.length !== 52) throw new Error("A hand requires 52 unique cards");
  s.board = [];
  s.burns = [];
  s.actions = [];
  s.initialStacks = s.players.map((p) => p.stack);
  s.currentBet = s.config.bigBlind;
  s.lastFullRaise = s.config.bigBlind;
  for (const p of s.players) {
    p.cards = [];
    p.folded = p.stack === 0;
    p.committed = 0;
    p.streetChips = 0;
    p.actedAt = null;
    p.reopenSize = s.config.bigBlind;
    p.lastAction = "";
  }
  pay(s, s.smallBlindSeat, s.config.smallBlind, "SMALL_BLIND");
  pay(s, s.bigBlindSeat, s.config.bigBlind, "BIG_BLIND");
  let at = s.dealer;
  for (let round = 0; round < 2; round++)
    for (let i = 0; i < surviving.length; i++) {
      at = nextSeat(s, at, (p) => s.initialStacks[s.players.indexOf(p)] > 0);
      s.players[at].cards.push(...take(s, 1));
    }
  settle(s, s.bigBlindSeat);
  return s;
}
export function getLegalActions(s: Session, playerId: string): LegalActions {
  const p = s.players.find((p) => p.id === playerId);
  const inactive: LegalActions = {
    playerId,
    fold: false,
    check: false,
    call: 0,
    amountToMatch: 0,
    callAllIn: false,
    bet: false,
    raise: false,
    reopened: false,
    minTo: 0,
    maxTo: 0,
    allIn: false,
    allInKind: null,
  };
  if (
    s.status !== "hand_in_progress" ||
    s.actor !== playerId ||
    !p ||
    !canAct(p)
  )
    return inactive;
  const due = Math.max(0, target(s, p) - p.streetChips);
  const call = Math.min(due, p.stack);
  const reopened =
    p.actedAt === null || s.currentBet - p.actedAt >= p.reopenSize;
  const contest = s.players.some((other) => other.id !== p.id && canAct(other));
  const maxTo = p.stack + p.streetChips;
  const minTo = s.currentBet + s.lastFullRaise;
  const aggressive = reopened && contest && maxTo > s.currentBet;
  return {
    playerId,
    fold: true,
    check: due === 0,
    call,
    amountToMatch: due,
    callAllIn: call > 0 && call === p.stack,
    bet: aggressive && s.currentBet === 0 && maxTo >= minTo,
    raise: aggressive && s.currentBet > 0 && maxTo >= minTo,
    reopened,
    minTo,
    maxTo,
    allIn: maxTo <= s.currentBet || aggressive,
    allInKind:
      maxTo <= s.currentBet
        ? "call"
        : aggressive
          ? maxTo >= minTo
            ? "full-raise"
            : "short-raise"
          : null,
  };
}
export function validateAction(s: Session, a: Action): string | null {
  const legal = getLegalActions(s, a.playerId);
  if (!legal.fold) return "It is not this participant’s turn.";
  if (a.type === "FOLD") return null;
  if (a.type === "CHECK")
    return legal.check ? null : "Cannot check while facing a commitment.";
  if (a.type === "CALL")
    return legal.call > 0 ? null : "There is nothing to call.";
  if (a.type === "ALL_IN")
    return legal.allIn
      ? null
      : "All-in would raise when action is not reopened or no opponent can respond.";
  if (a.type === "BET" || a.type === "RAISE") {
    if (!Number.isSafeInteger(a.to) || a.to < 0)
      return "The total must be a nonnegative integer.";
    if (!(a.type === "BET" ? legal.bet : legal.raise))
      return "This bet or raise is unavailable.";
    if (a.to < legal.minTo || a.to > legal.maxTo)
      return `Total must be between ${legal.minTo} and ${legal.maxTo}. Use All-in for a short all-in.`;
    return null;
  }
  return "Unknown action";
}
export function applyAction(
  previous: Session,
  a: Action,
  expectedRevision = previous.revision,
  now = Date.now(),
): Session {
  if (expectedRevision !== previous.revision)
    throw new Error("Stale action: the turn has already changed");
  const error = validateAction(previous, a);
  if (error) throw new Error(error);
  const s = structuredClone(previous);
  const index = s.players.findIndex((p) => p.id === a.playerId);
  const p = s.players[index];
  const before = s.currentBet;
  let amount = 0;
  if (a.type === "FOLD") p.folded = true;
  else if (a.type === "CALL")
    amount = Math.min(p.stack, Math.max(0, target(s, p) - p.streetChips));
  else if (a.type === "ALL_IN") amount = p.stack;
  else if (a.type === "BET" || a.type === "RAISE")
    amount = a.to - p.streetChips;
  p.stack -= amount;
  p.committed += amount;
  p.streetChips += amount;
  if (p.streetChips > before) {
    const increment = p.streetChips - before;
    if (increment >= s.lastFullRaise) s.lastFullRaise = increment;
    s.currentBet = p.streetChips;
  }
  p.actedAt = s.currentBet;
  p.reopenSize = s.lastFullRaise;
  log(s, p, a.type, amount);
  s.revision++;
  settle(s, index, now);
  return s;
}
function advance(s: Session) {
  if (s.street === "river") throw new Error("Cannot deal after river");
  s.burns.push(...take(s, 1));
  s.board.push(...take(s, s.street === "preflop" ? 3 : 1));
  s.street =
    s.street === "preflop" ? "flop" : s.street === "flop" ? "turn" : "river";
  s.currentBet = 0;
  s.lastFullRaise = s.config.bigBlind;
  for (const p of s.players) {
    p.streetChips = 0;
    p.actedAt = null;
    p.reopenSize = s.config.bigBlind;
  }
}
/** Resolve forced transitions synchronously. No timing or animation participates in the rules. */
function settle(s: Session, after: number, now = Date.now()) {
  for (let guard = 0; guard < 5; guard++) {
    const live = s.players.filter(liveHand);
    if (live.length === 1) {
      finish(s, "folds", now);
      return;
    }
    const able = live.filter(canAct);
    const pending = (p: Seat) =>
      canAct(p) && (p.actedAt === null || p.streetChips < s.currentBet);
    // A lone covering stack only gets a call/fold decision, never a meaningless dry-side-pot bet.
    const next =
      able.length <= 1
        ? able[0] && able[0].streetChips < target(s, able[0])
          ? s.players.indexOf(able[0])
          : -1
        : nextSeat(s, after, pending);
    if (next >= 0) {
      s.actor = s.players[next].id;
      return;
    }
    if (s.street === "river") {
      finish(s, "showdown", now);
      return;
    }
    advance(s);
    after = s.dealer;
  }
  throw new Error("Impossible state: forced transitions did not settle");
}
function finish(s: Session, reason: "folds" | "showdown", now: number) {
  const { awards, refunds } = resolvePots(s.players, s.board, s.dealer);
  const revealed = Object.fromEntries(
    reason === "showdown"
      ? s.players.filter(liveHand).map((p) => [p.id, [...p.cards]])
      : [],
  );
  for (const p of s.players) {
    const refund = refunds[p.id] ?? 0;
    if (refund) log(s, p, "REFUND", refund);
    p.stack +=
      refund + awards.reduce((sum, a) => sum + (a.payouts[p.id] ?? 0), 0);
    p.committed = 0;
    p.streetChips = 0;
  }
  const alive = s.players.filter((p) => p.stack > 0);
  const newlyOut = s.players.filter(
    (p) => p.stack === 0 && p.eliminatedHand === null,
  );
  // Same-hand busts rank by starting stack; equal starting stacks share a place.
  for (const p of newlyOut) {
    p.eliminatedHand = s.handNumber;
    p.place =
      alive.length +
      1 +
      newlyOut.filter(
        (q) =>
          s.initialStacks[s.players.indexOf(q)] >
          s.initialStacks[s.players.indexOf(p)],
      ).length;
  }
  const record: HandRecord = {
    replay: { version: 1, sessionId: s.id,
      participants: s.players.map(({ id, name, personality }) => ({ id, name, personality })),
      humanCards: [...s.players[0].cards] },
    number: s.handNumber,
    dealer: s.dealer,
    smallBlind: s.smallBlindSeat,
    bigBlind: s.bigBlindSeat,
    initialStacks: [...s.initialStacks],
    finalStacks: s.players.map((p) => p.stack),
    actions: structuredClone(s.actions),
    board: [...s.board],
    revealed,
    awards,
    refunds,
    reason,
  };
  s.history = [...s.history, record].slice(-100);
  s.actor = null;
  if (alive.length === 1) {
    s.status = "session_complete";
    s.winner = alive[0].id;
    alive[0].place = 1;
    s.finishedAt = now;
  } else if (s.players[0].stack === 0) {
    s.status = "player_eliminated";
    s.finishedAt = now;
  } else s.status = "hand_complete";
}
export function getPlayView(s: Session): PlayView {
  const last = s.history.at(-1);
  return {
    status: s.status,
    players: s.players.map((p) => ({
      ...p,
      cards:
        p.id === "you" ||
        (s.status !== "hand_in_progress" && last?.revealed[p.id])
          ? [...p.cards]
          : [],
    })),
    board: [...s.board],
    dealer: s.dealer,
    smallBlindSeat: s.smallBlindSeat,
    bigBlindSeat: s.bigBlindSeat,
    actor: s.actor,
    street: s.street,
    handNumber: s.handNumber,
    pot: s.players.reduce((n, p) => n + p.committed, 0),
    pots: s.status === "hand_in_progress" ? buildPots(s.players).pots : [],
    actions: structuredClone(s.actions),
    history: structuredClone(s.history),
    winner: s.winner,
  };
}
