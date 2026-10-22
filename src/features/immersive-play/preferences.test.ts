import { beforeEach, expect, it, vi } from "vitest";
import { DEFAULT_PREFERENCES, IMMERSIVE_KEY, loadImmersivePreferences, saveImmersivePreferences } from "./preferences";
import { toggleFullscreen } from "./hooks";
beforeEach(() => localStorage.clear());
it("starts muted and validates only its own independent settings schema", () => {
  localStorage.setItem("pokerlab.play.v2", "sentinel");
  expect(loadImmersivePreferences()).toEqual(DEFAULT_PREFERENCES);
  expect(saveImmersivePreferences({ ...DEFAULT_PREFERENCES, quality: "low", music: .23 })).toBeUndefined();
  expect(loadImmersivePreferences()).toMatchObject({ quality: "low", music: .23, muted: true });
  expect(localStorage.getItem("pokerlab.play.v2")).toBe("sentinel");
});
it("recovers malformed preferences and storage failures without touching session data", () => {
  for (const v of ["{", "null", '{"version":9}', JSON.stringify({ version: 1, preferences: { ...DEFAULT_PREFERENCES, music: 2 } })]) {
    localStorage.setItem(IMMERSIVE_KEY, v); expect(loadImmersivePreferences()).toEqual(DEFAULT_PREFERENCES);
  }
  const storage = { getItem() { throw new Error("denied"); } } as unknown as Storage;
  expect(loadImmersivePreferences(storage)).toEqual(DEFAULT_PREFERENCES);
});
it("requests browser fullscreen only on explicit invocation and handles rejection", async () => {
  const requestFullscreen = vi.fn().mockResolvedValue(undefined);
  const element = { requestFullscreen } as unknown as HTMLElement;
  expect(requestFullscreen).not.toHaveBeenCalled();
  expect(await toggleFullscreen(element)).toBeUndefined(); expect(requestFullscreen).toHaveBeenCalledTimes(1);
  requestFullscreen.mockRejectedValueOnce(new Error("denied"));
  expect(await toggleFullscreen(element)).toMatch(/declined/);
  expect(await toggleFullscreen({} as HTMLElement)).toMatch(/unavailable/);
});
