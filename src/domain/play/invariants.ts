import { validateCards } from "../cards";
import { assertConfig } from "./engine";
import { buildPots } from "./pots";
import type { Session } from "./types";

function require(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`Invalid session: ${message}`);
}
const integer = (v: unknown) =>
  typeof v === "number" && Number.isSafeInteger(v) && v >= 0;
const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
/** Runtime assertions are also used after EVERY transition in seeded stress simulations. */
export function assertSession(value: unknown): asserts value is Session {
  require(object(value), "expected an object");
  const s = value as unknown as Session;
  require(s.version === 2, "unsupported schema");
  require(object(s.config), "configuration");
  assertConfig(s.config);
  require(typeof s.id === "string" &&
    s.id.length > 0 &&
    s.id.length < 100, "identity");
  require(integer(s.revision) &&
    integer(s.handNumber) &&
    integer(s.startedAt) &&
    s.startedAt < 8.64e15, "counters");
  require(s.finishedAt === null ||
    (integer(s.finishedAt) && s.finishedAt >= s.startedAt), "finish time");
  require([
    "new_session",
    "hand_in_progress",
    "hand_complete",
    "player_eliminated",
    "session_complete",
  ].includes(s.status), "lifecycle");
  require(["preflop", "flop", "turn", "river"].includes(s.street), "street");
  require(Array.isArray(s.players) &&
    s.players.length === s.config.opponents + 1, "seats");
  require(s.supply === s.players.length * s.config.startingStack, "supply");
  require(s.players.every(
    (p, i) =>
      object(p) &&
      p.id === (i === 0 ? "you" : `npc-${i}`) &&
      typeof p.name === "string" &&
      p.name.length < 50 &&
      ["cautious", "aggressive", "casual", "analytical"].includes(
        p.personality,
      ),
  ), "player identity");
  for (const p of s.players) {
    require(integer(p.stack) &&
      integer(p.streetChips) &&
      integer(p.committed) &&
      p.streetChips <= p.committed, "chip counts");
    require(typeof p.folded === "boolean" &&
      Array.isArray(p.cards) &&
      (p.cards.length === 0 || p.cards.length === 2), "player hand");
    require(p.actedAt === null || integer(p.actedAt), "action level");
    require(integer(p.reopenSize) &&
      p.reopenSize >= s.config.bigBlind, "reopen threshold");
    require(p.eliminatedHand === null ||
      (integer(p.eliminatedHand) &&
        p.eliminatedHand > 0 &&
        p.eliminatedHand <= s.handNumber), "elimination");
    require(p.place === null ||
      (integer(p.place) &&
        p.place > 0 &&
        p.place <= s.players.length), "standing");
    require(p.eliminatedHand === null || p.stack === 0, "eliminated stack");
    require(typeof p.lastAction === "string" &&
      p.lastAction.length < 100, "last action");
  }
  require(s.players.reduce((n, p) => n + p.stack + p.committed, 0) ===
    s.supply, "chip conservation");
  require(integer(s.currentBet) &&
    integer(s.lastFullRaise) &&
    s.lastFullRaise >= s.config.bigBlind, "betting levels");
  require(Number.isInteger(s.dealer) &&
    s.dealer >= 0 &&
    s.dealer < s.players.length, "dealer");
  require(Array.isArray(s.deck) &&
    Array.isArray(s.board) &&
    Array.isArray(s.burns), "card locations");
  require(Array.isArray(s.initialStacks) &&
    s.initialStacks.every(integer), "initial stacks");
  require(Array.isArray(s.actions) && s.actions.length <= 10000, "action log");
  for (const [i, a] of s.actions.entries()) {
    require(object(a) &&
      a.sequence === i + 1 &&
      ["preflop", "flop", "turn", "river"].includes(a.street) &&
      s.players.some((p) => p.id === a.playerId) &&
      [
        "FOLD",
        "CHECK",
        "CALL",
        "BET",
        "RAISE",
        "ALL_IN",
        "SMALL_BLIND",
        "BIG_BLIND",
        "REFUND",
      ].includes(a.type) &&
      integer(a.added) &&
      integer(a.total), "public action");
  }
  require(Array.isArray(s.history) && s.history.length <= 100, "history bound");
  for (const h of s.history) {
    require(object(h) &&
      integer(h.number) &&
      h.number > 0 &&
      h.number <= s.handNumber &&
      ["folds", "showdown"].includes(h.reason), "history record");
    require([h.dealer, h.smallBlind, h.bigBlind].every(
      (n) => Number.isInteger(n) && n >= 0 && n < s.players.length,
    ), "historical positions");
    require(Array.isArray(h.initialStacks) &&
      Array.isArray(h.finalStacks) &&
      h.initialStacks.length === s.players.length &&
      h.finalStacks.length === s.players.length &&
      h.initialStacks.every(integer) &&
      h.finalStacks.every(integer), "historical stacks");
    require(h.initialStacks.reduce((a, b) => a + b, 0) === s.supply &&
      h.finalStacks.reduce((a, b) => a + b, 0) ===
        s.supply, "historical conservation");
    require(Array.isArray(h.board) &&
      [0, 3, 4, 5].includes(h.board.length) &&
      object(h.revealed) &&
      object(h.refunds) &&
      Array.isArray(h.awards) &&
      Array.isArray(h.actions), "historical details");
    require(h.reason !== "showdown" ||
      h.board.length === 5, "historical showdown");
    require(h.reason !== "folds" ||
      Object.keys(h.revealed).length === 0, "fold privacy");
    for (const [id, cards] of Object.entries(h.revealed))
      require(s.players.some((p) => p.id === id) &&
        Array.isArray(cards) &&
        cards.length === 2, "historical hole cards");
    validateCards([...h.board, ...Object.values(h.revealed).flat()]);
    for (const a of h.awards) {
      require(object(a) &&
        integer(a.amount) &&
        a.amount > 0 &&
        Array.isArray(a.eligible) &&
        a.eligible.length > 0 &&
        Array.isArray(a.contributors) &&
        Array.isArray(a.winners) &&
        a.winners.length > 0 &&
        object(a.payouts) &&
        typeof a.explanation === "string", "award");
      require(a.winners.every((id) => a.eligible.includes(id)) &&
        a.eligible.every((id) => a.contributors.includes(id)) &&
        a.contributors.every((id) =>
          s.players.some((p) => p.id === id),
        ), "pot eligibility");
      require(Object.entries(a.payouts).every(
        ([id, n]) => a.winners.includes(id) && integer(n),
      ) &&
        Object.values(a.payouts).reduce((n, x) => n + x, 0) ===
          a.amount, "award balance");
    }
    require(Object.entries(h.refunds).every(
      ([id, n]) => s.players.some((p) => p.id === id) && integer(n),
    ), "refunds");
    // Logs contain public commands only, never private or future cards.
    require(h.actions.every(
      (a, i) =>
        a.sequence === i + 1 &&
        s.players.some((p) => p.id === a.playerId) &&
        integer(a.added) &&
        integer(a.total) &&
        ["preflop", "flop", "turn", "river"].includes(a.street) &&
        [
          "FOLD",
          "CHECK",
          "CALL",
          "BET",
          "RAISE",
          "ALL_IN",
          "SMALL_BLIND",
          "BIG_BLIND",
          "REFUND",
        ].includes(a.type),
    ), "historical log");
  }
  // Reconcile every historical payout against recorded contributions and refunds.
  for (const h of s.history) {
    for (const [index, player] of s.players.entries()) {
      const committed = h.actions
        .filter((a) => a.playerId === player.id && a.type !== "REFUND")
        .reduce((n, a) => n + a.added, 0);
      const paid = h.awards.reduce(
        (n, a) => n + (a.payouts[player.id] ?? 0),
        0,
      );
      require(h.initialStacks[index] -
        committed +
        (h.refunds[player.id] ?? 0) +
        paid ===
        h.finalStacks[index], "historical payout accounting");
      require(!h.revealed[player.id] ||
        !h.actions.some(
          (a) => a.playerId === player.id && a.type === "FOLD",
        ), "folded hand revealed");
    }
  }
  if (s.status === "new_session") {
    require(s.history.length === 0 &&
      s.players.every((p) => p.stack === s.config.startingStack) &&
      s.winner === null &&
      s.finishedAt === null &&
      s.handNumber === 0 &&
      s.actor === null &&
      s.deck.length === 0 &&
      s.board.length === 0 &&
      s.burns.length === 0 &&
      s.players.every(
        (p) => p.cards.length === 0 && p.committed === 0,
      ), "new session");
    return;
  }
  require(s.handNumber > 0 &&
    s.initialStacks.length === s.players.length &&
    s.initialStacks.reduce((a, b) => a + b, 0) ===
      s.supply, "hand starting supply");
  require([s.smallBlindSeat, s.bigBlindSeat].every(
    (n) => Number.isInteger(n) && n >= 0 && n < s.players.length,
  ) && s.smallBlindSeat !== s.bigBlindSeat, "blinds");
  const boardCount = { preflop: 0, flop: 3, turn: 4, river: 5 }[s.street];
  require(s.board.length === boardCount &&
    s.burns.length ===
      { preflop: 0, flop: 1, turn: 2, river: 3 }[
        s.street
      ], "dealing progression");
  const all = [
    ...s.deck,
    ...s.burns,
    ...s.board,
    ...s.players.flatMap((p) => p.cards),
  ];
  require(all.length === 52, "card accounting");
  validateCards(all);
  require(s.players.every((p, i) =>
    s.initialStacks[i] > 0 ? p.cards.length === 2 : p.cards.length === 0,
  ), "dealt participants");
  if (s.status === "hand_in_progress") {
    const p = s.players.find((p) => p.id === s.actor);
    require(p &&
      !p.folded &&
      p.cards.length === 2 &&
      p.stack > 0, "current actor");
    require(s.players.filter((p) => p.cards.length === 2 && !p.folded).length >=
      2, "live contenders");
    require(s.players.every(
      (p) =>
        p.streetChips <= s.currentBet &&
        (p.actedAt === null || p.actedAt <= s.currentBet),
    ), "street targets");
    require(s.players.every(
      (p, i) => p.stack + p.committed === s.initialStacks[i],
    ), "hand contributions");
    require(s.winner === null && s.finishedAt === null, "unfinished outcome");
    const able = s.players.filter(
      (p) => p.cards.length === 2 && !p.folded && p.stack > 0,
    );
    const actor = s.players.find((p) => p.id === s.actor)!;
    const target =
      able.length === 1
        ? Math.min(
            s.currentBet,
            Math.max(
              0,
              ...s.players
                .filter(
                  (p) => p.id !== actor.id && p.cards.length === 2 && !p.folded,
                )
                .map((p) => p.streetChips),
            ),
          )
        : s.currentBet;
    require(actor.actedAt === null ||
      actor.streetChips < target, "actor has no outstanding action");
    for (const p of s.players) {
      const contributions = s.actions.filter(
        (a) => a.playerId === p.id && a.type !== "REFUND",
      );
      require(contributions.reduce((n, a) => n + a.added, 0) ===
        p.committed, "contribution log");
      require(contributions
        .filter((a) => a.street === s.street)
        .reduce((n, a) => n + a.added, 0) === p.streetChips, "street log");
    }
    buildPots(s.players);
  } else {
    require(s.actor === null &&
      s.players.every(
        (p) => p.committed === 0 && p.streetChips === 0,
      ), "settled accounting");
    const last = s.history.at(-1);
    require(last?.number === s.handNumber &&
      last.finalStacks.every(
        (n, i) => n === s.players[i].stack,
      ), "last completed hand");
    require(s.players.every(
      (p) => p.stack > 0 || p.eliminatedHand !== null,
    ), "zero-stack elimination");
    const alive = s.players.filter((p) => p.stack > 0);
    if (s.status === "session_complete")
      require(alive.length === 1 &&
        s.winner === alive[0].id &&
        s.finishedAt !== null, "winner");
    if (s.status === "player_eliminated")
      require(alive.length > 1 &&
        s.players[0].stack === 0 &&
        s.winner === null &&
        s.finishedAt !== null, "human elimination");
    if (s.status === "hand_complete")
      require(alive.length > 1 &&
        s.players[0].stack > 0 &&
        s.finishedAt === null, "next hand");
  }
}
