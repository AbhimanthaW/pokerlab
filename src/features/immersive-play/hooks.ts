import { useEffect, useReducer, useState } from "react";
import type { SceneSnapshot } from "./presentation";
import { synchronizePresentation, type PresentationState } from "./presentation";

export function usePageActive() {
  const [active, setActive] = useState(() => !document.hidden);
  useEffect(() => {
    const update = () => setActive(!document.hidden);
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);
  return active;
}
export function useReducedMotion(preference: boolean) {
  const [system, setSystem] = useState(() => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false);
  useEffect(() => {
    const query = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!query) return;
    const update = () => setSystem(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return preference || system;
}
export function usePresentation(snapshot: SceneSnapshot | null) {
  const [state, dispatch] = useReducer((previous: PresentationState, next: SceneSnapshot | null) =>
    synchronizePresentation(previous, next, performance.now()),
    snapshot, (initial) => ({ snapshot: initial, events: [] }));
  useEffect(() => { dispatch(snapshot); }, [snapshot]);
  return state;
}
export async function toggleFullscreen(element: HTMLElement): Promise<string | undefined> {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else if (element.requestFullscreen) await element.requestFullscreen();
    else return "Browser fullscreen is unavailable here. Play still fills this viewport.";
  } catch { return "Fullscreen was declined. Your hand is still active in this viewport."; }
}
export function useFullscreen() {
  const [fullscreen, setFullscreen] = useState(() => !!document.fullscreenElement);
  useEffect(() => {
    const update = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", update);
    return () => document.removeEventListener("fullscreenchange", update);
  }, []);
  return fullscreen;
}
