import type { Quality } from "./presentation";
export interface ImmersivePreferences {
  display: "3d" | "2d"; quality: Quality; cinematic: boolean;
  muted: boolean; master: number; music: number; effects: number; ambient: number;
}
export const IMMERSIVE_KEY = "pokerlab.immersive.v3";
export const DEFAULT_PREFERENCES: ImmersivePreferences = {
  display: "3d", quality: "auto", cinematic: true, muted: true,
  master: 0.55, music: 0.4, effects: 0.45, ambient: 0.18,
};
export function loadImmersivePreferences(storage?: Storage): ImmersivePreferences {
  try {
    const v = JSON.parse((storage ?? window.localStorage).getItem(IMMERSIVE_KEY) ?? "null");
    if (!v || v.version !== 1) return { ...DEFAULT_PREFERENCES };
    const p = v.preferences;
    if (!p || !["2d", "3d"].includes(p.display) || !["auto", "low", "medium", "high"].includes(p.quality) ||
      typeof p.cinematic !== "boolean" || typeof p.muted !== "boolean" ||
      ![p.master, p.music, p.effects, p.ambient].every((n) => typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 1))
      return { ...DEFAULT_PREFERENCES };
    return { display: p.display, quality: p.quality, cinematic: p.cinematic,
      muted: p.muted, master: p.master, music: p.music, effects: p.effects, ambient: p.ambient };
  } catch { return { ...DEFAULT_PREFERENCES }; }
}
export function saveImmersivePreferences(p: ImmersivePreferences): string | undefined {
  try { localStorage.setItem(IMMERSIVE_KEY, JSON.stringify({ version: 1, preferences: p })); }
  catch { return "Display and audio preferences could not be saved."; }
}
