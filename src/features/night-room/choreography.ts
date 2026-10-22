import { DECK_ANCHOR, seatAnchor, type Point, type SceneSnapshot, type VisualEvent } from "../immersive-play/presentation";
import type { CameraMode } from "./preferences";
export type PlayerPose = "IDLE" | "CHECK_CARDS" | "CHECK" | "CALL" | "BET" | "RAISE" | "FOLD" | "ALL_IN" | "SHOWDOWN" | "HAND_COMPLETE";
export type DealerPose = "IDLE" | "PREPARING_DECK" | "SHUFFLING" | "DEALING_PRIVATE" | "BURNING_CARD" | "DEALING_FLOP" | "DEALING_TURN" | "DEALING_RIVER" | "COLLECTING_CARDS" | "SHOWDOWN_PRESENTATION" | "AWARDING_POT" | "SESSION_COMPLETE";
export interface Cue { id: string; pose: DealerPose; at: number; duration: number; target?: string }
export interface CardFlight { at: number; delay: number; duration: number; from: Point }
/** Bounded choreography from public events. No commands, hidden cards or deck input. */
export function dealerCues(snapshot: SceneSnapshot | null, events: readonly VisualEvent[], rate = 1): Cue[] {
  const cues: Cue[] = [];
  for (const e of events.slice(-64)) {
    const add = (pose: DealerPose, delay: number, duration: number, target?: string) => cues.push({ id: `${e.id}:${pose}`, pose, at: e.at + delay * 1000 / rate, duration: duration / rate, target });
    if (e.kind === "DEAL") { add("PREPARING_DECK", 0, .14); add("SHUFFLING", .14, .36); add("DEALING_PRIVATE", .5, .085 * 2 * (snapshot?.seats.filter((p) => p.cards.length === 2).length ?? 4) + .28); }
    if (e.kind === "BOARD") {
      const count = e.boardCount ?? snapshot?.board.length ?? 3;
      const from = e.fromBoard ?? (count === 3 ? 0 : count - 1);
      const stages = [3,4,5].filter((n) => n > from && n <= count);
      stages.forEach((n, i) => { add("BURNING_CARD", i * .52, .2); add(n === 3 ? "DEALING_FLOP" : n === 4 ? "DEALING_TURN" : "DEALING_RIVER", i * .52 + .2, .32); });
    }
    if (e.kind === "SHOWDOWN") add("SHOWDOWN_PRESENTATION", events.some((q) => q.kind === "BOARD" && q.at === e.at) ? 1.6 : 0, .5);
    if (e.kind === "AWARD") { add("AWARDING_POT", events.some((q) => q.kind === "BOARD" && q.at === e.at) ? 2.15 : .5, .65, e.playerId); add("COLLECTING_CARDS", events.some((q) => q.kind === "BOARD" && q.at === e.at) ? 2.85 : 1.2, .45); }
    if (e.kind === "COMPLETE") add("SESSION_COMPLETE", 3.35, .6);
  }
  return [...new Map(cues.map((c) => [`${c.pose}:${c.at}`, c])).values()].sort((a, b) => a.at - b.at).slice(-48);
}
export function activeDealerCue(cues: readonly Cue[], now: number, motion: boolean): { pose: DealerPose; progress: number; target?: string } {
  if (!motion) return { pose: "IDLE", progress: 0 };
  let cue: Cue | undefined;
  for(let i=cues.length-1;i>=0;i--)if(now>=cues[i].at && now<cues[i].at+cues[i].duration*1000){cue=cues[i];break;}
  return cue ? { pose: cue.pose, progress: (now - cue.at) / (cue.duration * 1000), target: cue.target } : { pose: "IDLE", progress: 0 };
}
export function privateFlight(snapshot: SceneSnapshot, events: readonly VisualEvent[], seat: number, card: number, rate = 1): CardFlight | undefined {
  const e = [...events].reverse().find((e) => e.kind === "DEAL"); if (!e) return;
  const dealer = snapshot.seats.findIndex((p) => p.dealer);
  const order = snapshot.seats.filter((p) => p.cards.length === 2).map((p) => p.index).sort((a, b) => ((a - dealer - 1 + snapshot.seats.length) % snapshot.seats.length) - ((b - dealer - 1 + snapshot.seats.length) % snapshot.seats.length));
  const index = order.indexOf(seat); if (index < 0) return;
  return { at: e.at, delay: (snapshot.actor === "you" && seat === 0 ? 0 : .5 + (card * order.length + index) * .085) / rate, duration: .25 / rate, from: [...DECK_ANCHOR] };
}
export function boardFlight(snapshot: SceneSnapshot, events: readonly VisualEvent[], index: number, rate = 1): CardFlight | undefined {
  const e = [...events].reverse().find((e) => e.kind === "BOARD"); if (!e) return;
  const count = e.boardCount ?? snapshot.board.length, from = e.fromBoard ?? (count === 3 ? 0 : count - 1);
  const stages = [3,4,5].filter((n) => n > from && n <= count);
  const stage = Math.max(0, stages.indexOf(index < 3 ? 3 : index + 1));
  return { at: e.at, delay: (stage * .52 + .2 + (index < 3 ? index * .045 : 0)) / rate, duration: .28 / rate, from: [...DECK_ANCHOR] };
}
export function playerPose(events: readonly VisualEvent[], now: number, inspect: boolean, motion: boolean): { pose: PlayerPose; amount: number } {
  if (inspect) return { pose: "CHECK_CARDS", amount: motion ? 1 : 0 };
  if (!motion) return { pose: "IDLE", amount: 0 };
  let e: VisualEvent | undefined;
  for(let i=events.length-1;i>=0;i--){const candidate=events[i];if((candidate.playerId==="you"&&candidate.kind==="ACTION")||["SHOWDOWN","COMPLETE","AWARD"].includes(candidate.kind)){e=candidate;break;}}
  if (!e || now < e.at || now - e.at > 850) return { pose: "IDLE", amount: 0 };
  const pose: PlayerPose = e.kind === "SHOWDOWN" ? "SHOWDOWN" : e.kind === "COMPLETE" || e.kind === "AWARD" ? "HAND_COMPLETE" : ["CHECK", "CALL", "BET", "RAISE", "FOLD", "ALL_IN"].includes(e.action ?? "") ? e.action as PlayerPose : "IDLE";
  return { pose, amount: Math.sin((now - e.at) / 850 * Math.PI) };
}
export function gazeYaw(snapshot: SceneSnapshot, seat: number, dealing: boolean): number {
  const origin = seatAnchor(seat, snapshot.seats.length - 1), winner = snapshot.awards.at(-1)?.winners[0];
  const targetSeat = snapshot.seats.find((p) => p.id === (snapshot.status !== "hand_in_progress" ? winner : snapshot.actor));
  const target = dealing ? [.5, 0, -2.65] : targetSeat && targetSeat.index !== seat ? seatAnchor(targetSeat.index, snapshot.seats.length - 1) : [0, 0, 0];
  const forward = Math.atan2(-origin[0], -origin[2]); let relative = Math.atan2(target[0] - origin[0], target[2] - origin[2]) - forward;
  relative = Math.atan2(Math.sin(relative), Math.cos(relative)); return Math.max(-.38, Math.min(.38, relative));
}
export function cameraEmphasis(snapshot: SceneSnapshot | null, events: readonly VisualEvent[], now: number, mode: CameraMode, motion: boolean): { x: number; y: number; zoom: number } {
  if (!motion || mode === "instant" || snapshot?.actor === "you") return { x: 0, y: 0, zoom: 1 };
  let e: VisualEvent | undefined;
  for(let i=events.length-1;i>=0;i--)if(now>=events[i].at&&now-events[i].at<1800){e=events[i];break;}
  if (!e || (e.kind === "ACTION" && !["BET", "RAISE", "ALL_IN"].includes(e.action ?? ""))) return { x: 0, y: 0, zoom: 1 };
  const k = Math.sin((now - e.at) / 1800 * Math.PI) * (mode === "cinematic" ? 1 : .35);
  const actor = snapshot?.seats.find((p) => p.id === e.playerId), x = actor && snapshot ? seatAnchor(actor.index, snapshot.seats.length - 1)[0] * .04 * k : 0;
  return { x, y: e.kind === "BOARD" ? -.08 * k : .035 * k, zoom: 1 - .035 * k };
}
