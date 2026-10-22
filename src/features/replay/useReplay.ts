import { useEffect, useReducer } from "react";
export interface Playback { index: number; playing: boolean; speed: number; at?: number }
type Command = { type: "seek"; index: number } | { type: "toggle" } | { type: "tick" } | { type: "restart" } | { type: "speed"; speed: number };
export function playbackReducer(state: Playback, command: Command & { at?: number }, count: number): Playback {
  if (command.type !== "speed" && command.type !== "toggle") state = { ...state, at: command.at ?? state.at };
  if (command.type === "seek" && !Number.isFinite(command.index)) return state;
  if (command.type === "seek") return { ...state, playing: false, index: Math.max(0, Math.min(count - 1, Math.trunc(command.index))) };
  if (command.type === "speed") return [.5, 1, 2].includes(command.speed) ? { ...state, speed: command.speed } : state;
  if (command.type === "restart") return { ...state, index: 0, playing: false };
  if (command.type === "toggle") return { ...state, index: state.index === count - 1 ? 0 : state.index, playing: !state.playing };
  const index = Math.min(count - 1, state.index + 1);
  return { ...state, index, playing: index < count - 1 };
}
export function useReplay(count: number, speed: number, active: boolean) {
  const [state, dispatch] = useReducer((s: Playback, c: Command & { at?: number }) => playbackReducer(s, c, count), { index: 0, playing: false, speed });
  useEffect(() => {
    if (!state.playing || !active) return;
    const timer = window.setTimeout(() => dispatch({ type: "tick", at: performance.now() }), 1100 / state.speed);
    return () => window.clearTimeout(timer);
  }, [state.index, state.playing, state.speed, active]);
  return { ...state, dispatch: (command: Command) => dispatch({ ...command, at: performance.now() }) };
}
