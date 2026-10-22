import { validateCards } from "../cards";
import type { Card } from "../types";
import type { HandRecord, PublicAction } from "./types";
export interface PublicMemory {
  version: 1; sessionId: string; hand: number;
  completed: { number: number; actions: PublicAction[]; revealed: Record<string, Card[]>; participants: string[] }[];
  current: PublicAction[];
}
export const MEMORY_HANDS = 12, MEMORY_ACTIONS = 64;
/** Explicit public allowlist; never serializes replay metadata or a participant's private hand. */
export function publicMemory(sessionId: string, hand: number, history: readonly HandRecord[], current: readonly PublicAction[]): PublicMemory {
  const actions = (list: readonly PublicAction[]) => list.slice(-MEMORY_ACTIONS).map(({ sequence, street, playerId, type, added, total }) => ({ sequence, street, playerId, type, added, total }));
  return {
    version: 1, sessionId, hand,
    completed: history.slice(-MEMORY_HANDS).map((h) => ({ number: h.number, actions: actions(h.actions),
      participants: h.initialStacks.flatMap((stack, i) => stack > 0 ? [i ? `npc-${i}` : "you"] : []),
      revealed: Object.fromEntries(Object.entries(h.revealed).map(([id, cards]) => [id, cards.map(({ id, rank, suit }) => ({ id, rank, suit }))])) })),
    current: actions(current),
  };
}
export function validatePublicMemory(value: unknown): asserts value is PublicMemory {
  const m = value as PublicMemory;
  const id = (v: unknown) => typeof v === "string" && /^(you|npc-[1-5])$/.test(v);
  const actions = (v: PublicAction[]) => Array.isArray(v) && v.length <= MEMORY_ACTIONS && v.every((a) => a && id(a.playerId) && Number.isSafeInteger(a.sequence) && a.sequence >= 0 && ["preflop", "flop", "turn", "river"].includes(a.street) && ["FOLD", "CHECK", "CALL", "BET", "RAISE", "ALL_IN", "SMALL_BLIND", "BIG_BLIND", "REFUND"].includes(a.type) && [a.added, a.total].every((n) => Number.isSafeInteger(n) && n >= 0));
  if (!m || m.version !== 1 || typeof m.sessionId !== "string" || m.sessionId.length > 100 || !Number.isSafeInteger(m.hand) || m.hand < 0 || !Array.isArray(m.completed) || m.completed.length > MEMORY_HANDS || !actions(m.current)) throw new Error("Invalid public memory");
  for (const h of m.completed) {
    if (!h || !Number.isSafeInteger(h.number) || h.number < 1 || h.number > m.hand || !actions(h.actions) || !Array.isArray(h.participants) || h.participants.length > 6 || !h.participants.every(id) || !h.revealed || typeof h.revealed !== "object" || Object.keys(h.revealed).length > 6) throw new Error("Invalid public hand memory");
    for (const [player, cards] of Object.entries(h.revealed)) { if (!id(player) || !Array.isArray(cards) || cards.length !== 2) throw new Error("Invalid revealed memory"); validateCards(cards); }
    validateCards(Object.values(h.revealed).flat());
  }
}
/** A small public tendency adjustment; fewer than eight observations yield no adjustment. */
export function memoryAdjustment(memory: PublicMemory | undefined, playerId: string, opponents: readonly string[]): number {
  if (!memory) return 0;
  const actions = [...memory.completed.flatMap((h) => h.actions), ...memory.current].filter((a) => a.playerId !== playerId && opponents.includes(a.playerId) && !["SMALL_BLIND", "BIG_BLIND", "REFUND"].includes(a.type));
  if (actions.length < 8) return 0;
  const aggression = actions.filter((a) => ["BET", "RAISE", "ALL_IN"].includes(a.type)).length / actions.length;
  return Math.max(-.035, Math.min(.035, (aggression - .3) * .07));
}
