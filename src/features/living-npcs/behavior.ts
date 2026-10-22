import type { Personality } from "../../domain/play/types";
import type { Gesture } from "../immersive-play/presentation";
export const PRESENTATION_PROFILES = {
  cautious: { movement: .55, tempo: .8, lean: .025, gaze: .035 },
  aggressive: { movement: .95, tempo: 1.25, lean: .085, gaze: .055 },
  casual: { movement: 1.15, tempo: .7, lean: -.025, gaze: .095 },
  analytical: { movement: .65, tempo: .95, lean: .055, gaze: .025 },
} as const;
export type Expression = "neutral" | "focused" | "pleased" | "disappointed" | "surprised" | "relaxed";
export function publicVariation(identity: string): number { let n = 2166136261; for (const c of identity) n = Math.imul(n ^ c.charCodeAt(0), 16777619); return (n >>> 0) / 4294967296; }
/** Deterministic public presentation only. No card-strength or policy inputs. */
export function characterPose(personality: Personality, gesture: Gesture, elapsed: number, variation: number, motion: boolean) {
  const p = PRESENTATION_PROFILES[personality], phase = variation * Math.PI * 2;
  const t = Math.max(0, elapsed) * p.tempo, moving = motion ? p.movement : 0;
  const action = ["CHECKING", "CALLING", "RAISING", "ALL_IN", "ACTING"].includes(gesture);
  const envelope = action && motion ? Math.sin(Math.min(1, t / .95) * Math.PI) : 0;
  const focused = ["THINKING", "OBSERVING", "WAITING_FOR_SHOWDOWN"].includes(gesture);
  const expression: Expression = gesture === "ELIMINATED" || gesture === "FOLDING" ? "disappointed" : gesture === "ALL_IN" ? "surprised" : gesture === "HAND_COMPLETE" ? "pleased" : focused ? "focused" : personality === "casual" ? "relaxed" : "neutral";
  return {
    body: (gesture === "ELIMINATED" ? .15 : focused || action ? p.lean : .012) + Math.sin(t * .9 + phase) * .012 * moving,
    headX: (gesture === "THINKING" || gesture === "FOLDING" ? .12 : 0) + Math.sin(t * .6 + phase) * .018 * moving,
    headY: motion ? Math.sin(t * .38 + phase) * p.gaze * moving : 0,
    handZ: envelope * (gesture === "RAISING" || gesture === "ALL_IN" ? .12 : .065) * p.movement,
    handY: gesture === "WAITING_FOR_SHOWDOWN" ? .025 : gesture === "SHOWDOWN" ? .04 : envelope * (gesture === "ALL_IN" ? .08 : .025),
    brow: expression === "surprised" ? .024 : expression === "focused" ? -.009 : expression === "disappointed" ? .009 : 0,
    mouth: expression === "surprised" ? 1.8 : expression === "pleased" ? .6 : .95,
    expression,
  };
}
export interface DialogueContext { hand: number; status: string; activePlayers: number; name: string; personality: Personality }
export function contextualLine(context: DialogueContext): string {
  if (context.status === "session_complete") return "That is the last hand. Thanks for the table.";
  if (context.status === "player_eliminated") return "Every hand leaves something to review.";
  if (context.status === "hand_complete") return { cautious: "A moment to review that one.", aggressive: "Let's see the next hand.", casual: "Interesting round. Shall we keep going?", analytical: "The action history is worth a look." }[context.personality];
  if (context.activePlayers === 2) return "Just two seats now. Same game, different rhythm.";
  if (context.hand === 1) return "Good to have everyone at the table.";
  return { cautious: "One hand at a time.", aggressive: "New hand. Fresh start.", casual: "All right, another round.", analytical: "Positions have moved. Let's begin." }[context.personality];
}
