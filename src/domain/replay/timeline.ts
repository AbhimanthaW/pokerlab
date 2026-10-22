import { validateCards } from "../cards";
import type { Card } from "../types";
import type { HandRecord, Personality, PublicAction, ReplayMetadata, Street } from "../play/types";
import { publicVariation } from "../../features/living-npcs/behavior";
import type { SceneSnapshot, Gesture } from "../../features/immersive-play/presentation";

export type ReplayEvent = { kind: "start" | "deal" | "board" | "action" | "showdown" | "award" | "finish"; label: string; street: Street; boardCount?: number; action?: PublicAction; award?: number };
export interface ReplayRecord { version: 1; id: string; hand: HandRecord; participants: ReplayMetadata["participants"]; humanCards: Card[]; limited: boolean; events: ReplayEvent[] }
const streets: Street[] = ["preflop", "flop", "turn", "river"];
const profiles: Personality[] = ["cautious", "aggressive", "casual", "analytical"];
/** Invalid optional V4 metadata never prevents reading valid legacy hand history. */
export function replayMetadata(hand: HandRecord): ReplayMetadata | undefined {
  try {
    const m = hand.replay;
    if (!m || m.version !== 1 || typeof m.sessionId !== "string" || m.sessionId.length > 100 || !Array.isArray(m.participants) || m.participants.length !== hand.initialStacks.length || !Array.isArray(m.humanCards) || ![0, 2].includes(m.humanCards.length)) return;
    if (!m.participants.every((p, i) => p.id === (i ? `npc-${i}` : "you") && typeof p.name === "string" && p.name.length < 50 && profiles.includes(p.personality))) return;
    const other = Object.entries(hand.revealed).filter(([id]) => id !== "you").flatMap(([, c]) => c);
    validateCards([...hand.board, ...other, ...m.humanCards]);
    if (hand.revealed.you && JSON.stringify(hand.revealed.you) !== JSON.stringify(m.humanCards)) return;
    return { version: 1, sessionId: m.sessionId, participants: m.participants.map(({ id, name, personality }) => ({ id, name, personality })), humanCards: m.humanCards.map(({ id, rank, suit }) => ({ id, rank, suit })) };
  } catch { return; }
}
/** No deck or live controller is accepted. Existing ordered action records are reused. */
export function buildReplay(hand: HandRecord, legacyNames?: Record<string, string>): ReplayRecord {
  const meta = replayMetadata(hand);
  const cards = (list: Card[]) => list.map(({ id, rank, suit }) => ({ id, rank, suit }));
  // Retain only the existing public record fields; unknown saved properties cannot reach the renderer.
  const h: HandRecord = { number: hand.number, dealer: hand.dealer, smallBlind: hand.smallBlind, bigBlind: hand.bigBlind,
    initialStacks: [...hand.initialStacks], finalStacks: [...hand.finalStacks], reason: hand.reason,
    board: cards(hand.board), revealed: Object.fromEntries(Object.entries(hand.revealed).map(([id, c]) => [id, cards(c)])),
    actions: hand.actions.map(({ sequence, street, playerId, type, added, total }) => ({ sequence, street, playerId, type, added, total })),
    awards: hand.awards.map(({ amount, eligible, contributors, winners, payouts, explanation }) => ({ amount, eligible: [...eligible], contributors: [...contributors], winners: [...winners], payouts: { ...payouts }, explanation })), refunds: { ...hand.refunds } };
  const participants = meta?.participants ?? h.initialStacks.map((_, i) => ({ id: i ? `npc-${i}` : "you", name: legacyNames?.[i ? `npc-${i}` : "you"] ?? (i ? `Player ${i + 1}` : "You"), personality: profiles[i % 4] }));
  const names = Object.fromEntries(participants.map((p) => [p.id, p.name]));
  const events: ReplayEvent[] = [{ kind: "start", street: "preflop", label: `Hand ${h.number} · dealer ${participants[h.dealer].name} · blinds ${participants[h.smallBlind].name} / ${participants[h.bigBlind].name}` }];
  let street: Street = "preflop", dealt = false;
  const revealThrough = (next: Street) => {
    while (streets.indexOf(street) < streets.indexOf(next)) {
      street = streets[streets.indexOf(street) + 1];
      const boardCount = street === "flop" ? 3 : street === "turn" ? 4 : 5;
      if (h.board.length >= boardCount) events.push({ kind: "board", street, boardCount, label: `${street} revealed` });
    }
  };
  for (const action of h.actions.filter((a) => a.type !== "REFUND")) {
    if (!["SMALL_BLIND", "BIG_BLIND"].includes(action.type) && !dealt) { events.push({ kind: "deal", street: "preflop", label: "Two private cards dealt to each eligible seat" }); dealt = true; }
    revealThrough(action.street);
    events.push({ kind: "action", street: action.street, action, label: `${names[action.playerId]}: ${action.type.replaceAll("_", " ").toLowerCase()}${action.added ? ` ${action.added} chips` : ""}${["BET", "RAISE", "ALL_IN"].includes(action.type) ? ` (total ${action.total})` : ""}` });
  }
  if (!dealt) events.push({ kind: "deal", street: "preflop", label: "Private cards dealt" });
  revealThrough(h.board.length === 5 ? "river" : h.board.length === 4 ? "turn" : h.board.length === 3 ? "flop" : "preflop");
  if (h.reason === "showdown") events.push({ kind: "showdown", street, label: "Showdown · only legitimately tabled hands revealed" });
  // Refunds occur before pot distribution, with the exact recorded values.
  for (const [id, added] of Object.entries(h.refunds)) events.push({ kind: "action", street, action: { sequence: 0, street, playerId: id, type: "REFUND", added, total: 0 }, label: `${names[id]}: ${added} uncalled chips returned` });
  h.awards.forEach((a, award) => events.push({ kind: "award", street, award, label: `${award ? `Side pot ${award}` : "Main pot"}: ${a.amount} → ${a.winners.map((id) => names[id]).join(" & ")}. ${a.explanation}` }));
  events.push({ kind: "finish", street, label: "Hand complete · final stacks" });
  return { version: 1, id: `${meta?.sessionId ?? "legacy"}:${h.number}`, hand: h, participants, humanCards: meta?.humanCards ?? [], limited: !meta, events };
}
/** Absolute seeking reconstructs accounting, never asks the game engine to resolve anything. */
export function replaySnapshot(record: ReplayRecord, index: number): SceneSnapshot {
  if (!Number.isInteger(index) || index < 0 || index >= record.events.length) throw new Error("Invalid replay position");
  const h = record.hand;
  const seats = record.participants.map((p, i) => ({ ...p, index: i, variation: publicVariation(`${record.id}:${p.id}`), stack: h.initialStacks[i], committed: 0, cards: [] as (Card | null)[], folded: false, eliminated: h.initialStacks[i] === 0, gesture: "IDLE" as Gesture, dealer: i === h.dealer, blind: i === h.smallBlind ? "SB" as const : i === h.bigBlind ? "BB" as const : null, lastAction: "" }));
  let board: Card[] = [], street: Street = "preflop", pot = 0;
  const actions: SceneSnapshot["actions"] = [], awards: SceneSnapshot["awards"] = [];
  let actor: string | null = null;
  for (const event of record.events.slice(0, index + 1)) {
    if (event.street !== street) { seats.forEach((p) => { p.committed = 0; }); street = event.street; }
    if (event.kind === "deal") seats.forEach((p) => { if (!p.eliminated) p.cards = p.id === "you" && record.humanCards.length ? [...record.humanCards] : [null, null]; });
    if (event.kind === "board") board = h.board.slice(0, event.boardCount);
    if (event.kind === "action" && event.action) {
      const a = event.action, i = seats.findIndex((p) => p.id === a.playerId), p = seats[i];
      if (!p) throw new Error("Replay action has unknown participant");
      if (a.type === "REFUND") { p.stack += a.added; p.committed = Math.max(0, p.committed - a.added); pot -= a.added; }
      else { p.stack -= a.added; p.committed += a.added; pot += a.added; }
      if (a.type === "FOLD") p.folded = true;
      p.lastAction = a.type; p.gesture = a.type === "FOLD" ? "FOLDING" : a.type === "CHECK" ? "CHECKING" : a.type === "CALL" ? "CALLING" : a.type === "ALL_IN" ? "ALL_IN" : ["BET", "RAISE"].includes(a.type) ? "RAISING" : "OBSERVING";
      actor = p.id; actions.push({ sequence: actions.length + 1, playerId: p.id, type: a.type, added: a.added });
    }
    if (event.kind === "showdown") for (const p of seats) { if (h.revealed[p.id]) p.cards = [...h.revealed[p.id]]; if (!p.folded && !p.eliminated) p.gesture = "SHOWDOWN"; }
    if (event.kind === "award" && event.award !== undefined) {
      const a = h.awards[event.award];
      for (const p of seats) p.stack += a.payouts[p.id] ?? 0;
      pot -= a.amount; seats.forEach((p) => { p.committed = 0; }); awards.push({ amount: a.amount, winners: [...a.winners] });
    }
    if (event.kind === "finish") { seats.forEach((p) => { p.gesture = p.stack === 0 ? "ELIMINATED" : "HAND_COMPLETE"; p.eliminated = p.stack === 0; }); actor = null; }
  }
  if (pot < 0 || seats.some((p) => p.stack < 0) || seats.reduce((n, p) => n + p.stack, pot) !== h.initialStacks.reduce((a, b) => a + b, 0)) throw new Error("Replay chip accounting is inconsistent");
  const final = record.events[index].kind === "finish";
  if (final && seats.some((p, i) => p.stack !== h.finalStacks[i])) throw new Error("Replay final stacks differ from history");
  // Earlier-street chips move to the central stack; no future pot award is exposed.
  return { id: `replay:${record.id}`, revision: index, hand: h.number, status: final ? "hand_complete" : "hand_in_progress", street, actor, board, seats, pot, pots: [], actions, awards };
}
