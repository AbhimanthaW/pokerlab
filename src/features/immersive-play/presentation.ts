import { getPlayView } from "../../domain/play/engine";
import type { Card } from "../../domain/types";
import type { Session, SessionStatus, Street } from "../../domain/play/types";

export type Point = [number, number, number];
export type Gesture = "IDLE" | "THINKING" | "ACTING" | "FOLDING" | "CHECKING" |
  "CALLING" | "RAISING" | "ALL_IN" | "SHOWDOWN" | "HAND_COMPLETE" | "ELIMINATED";
export interface SceneSeat {
  id: string; name: string; index: number; stack: number; committed: number;
  cards: (Card | null)[]; folded: boolean; eliminated: boolean; gesture: Gesture;
  dealer: boolean; blind: "SB" | "BB" | null; lastAction: string;
}
export interface SceneSnapshot {
  id: string; revision: number; hand: number; status: SessionStatus;
  street: Street; actor: string | null; board: Card[]; seats: SceneSeat[];
  pot: number; pots: { amount: number; eligible: string[] }[];
  actions: { sequence: number; playerId: string; type: string; added: number }[];
  awards: { amount: number; winners: string[] }[];
}
const gestures: Record<string, Gesture> = {
  FOLD: "FOLDING", CHECK: "CHECKING", CALL: "CALLING", BET: "RAISING",
  RAISE: "RAISING", ALL_IN: "ALL_IN",
};
/** Only this public projection reaches the renderer. No deck, burns or hidden hole cards. */
export function projectScene(s: Session): SceneSnapshot {
  const v = getPlayView(s);
  const result = s.status !== "hand_in_progress";
  return {
    id: s.id, revision: s.revision, hand: s.handNumber, status: s.status,
    street: s.street, actor: s.actor, board: v.board, pot: v.pot,
    pots: v.pots.map(({ amount, eligible }) => ({ amount, eligible })),
    seats: v.players.map((p, index) => {
      const action = v.actions.filter((a) => a.playerId === p.id).at(-1);
      return {
        id: p.id, name: p.name, index, stack: p.stack, committed: p.streetChips,
        cards: s.initialStacks[index] > 0 ? [p.cards[0] ?? null, p.cards[1] ?? null] : [],
        folded: p.folded, eliminated: p.eliminatedHand !== null,
        gesture: p.eliminatedHand !== null ? "ELIMINATED" :
          result ? (p.cards.length ? "SHOWDOWN" : "HAND_COMPLETE") :
          p.folded ? "FOLDING" : p.stack === 0 ? "ALL_IN" :
          s.actor === p.id ? "THINKING" : gestures[action?.type ?? ""] ?? "IDLE",
        dealer: index === s.dealer,
        blind: index === s.smallBlindSeat ? "SB" : index === s.bigBlindSeat ? "BB" : null,
        lastAction: p.lastAction,
      };
    }),
    actions: v.actions.map(({ sequence, playerId, type, added }) => ({ sequence, playerId, type, added })),
    awards: result ? (v.history.at(-1)?.awards.map(({ amount, winners }) => ({ amount, winners })) ?? []) : [],
  };
}
const angles: Record<number, number[]> = {
  1: [0.8], 2: [0.65, 1.35], 3: [0.45, 0.85, 1.45],
  4: [0.4, 0.75, 1.25, 1.6], 5: [0.35, 0.65, 0.85, 1.28, 1.65],
};
export function seatAnchor(index: number, opponents: number): Point {
  if (index === 0) return [0, 0, 2.9];
  const fraction = angles[opponents]?.[index - 1];
  if (fraction === undefined) throw new Error("Invalid presentation seat");
  return [-Math.sin(fraction * Math.PI) * 4.05, 0, Math.cos(fraction * Math.PI) * 2.9];
}
export const POT_ANCHOR: Point = [0, .08, -.95];
export const DECK_ANCHOR: Point = [0.65, 0.18, -1.65];
export type VisualEvent = {
  id: string; kind: "DEAL" | "ACTION" | "BOARD" | "AWARD" | "SHOWDOWN" | "COMPLETE";
  at: number; playerId?: string; action?: string; amount?: number;
};
export interface PresentationState { snapshot: SceneSnapshot | null; events: VisualEvent[] }
export function synchronizePresentation(
  old: PresentationState, next: SceneSnapshot | null, now: number,
): PresentationState {
  if (!next) return { snapshot: null, events: [] };
  const prev = old.snapshot;
  // Restoration establishes a baseline, never replays past contributions or sound.
  if (!prev) return { snapshot: next, events: next.hand ? [{ id: `${next.id}:${next.revision}:deal`, kind: "DEAL", at: now }] : [] };
  if (prev.id !== next.id) return { snapshot: next, events: [] };
  if (next.revision <= prev.revision) return old;
  const events: VisualEvent[] = [];
  const event = (kind: VisualEvent["kind"], suffix: string, data = {}) =>
    events.push({ id: `${next.id}:${next.revision}:${suffix}`, kind, at: now, ...data });
  if (next.hand !== prev.hand) event("DEAL", "deal");
  for (const a of next.actions) {
    if (next.hand === prev.hand && a.sequence <= prev.actions.length) continue;
    if (["SMALL_BLIND", "BIG_BLIND", "REFUND"].includes(a.type)) continue;
    event("ACTION", `action-${a.sequence}`, { playerId: a.playerId, action: a.type, amount: a.added });
  }
  if (next.board.length > (next.hand === prev.hand ? prev.board.length : 0)) event("BOARD", "board");
  if (next.status !== "hand_in_progress" && (prev.status === "hand_in_progress" || next.hand !== prev.hand)) {
    if (next.board.length === 5) event("SHOWDOWN", "showdown");
    for (const [i, award] of next.awards.entries())
      for (const winner of award.winners)
        event("AWARD", `award-${i}-${winner}`, { playerId: winner, amount: award.amount });
    if (next.status === "session_complete" || next.status === "player_eliminated") event("COMPLETE", "complete");
  }
  return { snapshot: next, events: [...(next.hand === prev.hand ? old.events : []), ...events]
    .filter((e) => now - e.at < 2200).slice(-64) };
}

export interface CameraLook { yaw: number; pitch: number; zoom: number }
export const DEFAULT_LOOK: CameraLook = { yaw: 0, pitch: 0, zoom: 1 };
export const CAMERA_RIG = {
  desktop: { height: 1.6, distance: 4.85, fov: 53 },
  portrait: { height: 2, distance: 6.7, fov: 59 },
  lookAtZ: -.35, near: .1, far: 40,
} as const;
export function boundLook(value: CameraLook): CameraLook {
  const clamp = (n: number, low: number, high: number, fallback: number) =>
    Number.isFinite(n) ? Math.max(low, Math.min(high, n)) : fallback;
  return { yaw: clamp(value.yaw, -0.2, 0.2, 0), pitch: clamp(value.pitch, -0.12, 0.12, 0),
    zoom: clamp(value.zoom, 0.9, 1.12, 1) };
}
export type Quality = "auto" | "low" | "medium" | "high";
export function qualityConfig(quality: Quality, width: number, cores = 4) {
  const resolved = quality === "auto" ? (width < 760 || cores < 6 ? "low" : "medium") : quality;
  return { resolved, dpr: resolved === "low" ? 1 : resolved === "medium" ? 1.4 : 1.8,
    shadows: resolved !== "low", detail: resolved === "high", segments: resolved === "low" ? 12 : 24 };
}
