import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { AudioManager } from "./AudioManager";
import { DEFAULT_PREFERENCES } from "../preferences";

function node() { return { connect: vi.fn(), disconnect: vi.fn(), start: vi.fn(), stop: vi.fn(),
  gain: { value: 0, setTargetAtTime: vi.fn(), setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
  frequency: { value: 0, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() } }; }
const ctx = { resume: vi.fn(async () => {}), suspend: vi.fn(async () => {}), close: vi.fn(async () => {}),
  sampleRate: 80, currentTime: 0, destination: {}, state: "running",
  createGain: vi.fn(node), createBufferSource: vi.fn(node), createBiquadFilter: vi.fn(node), createOscillator: vi.fn(node),
  createBuffer: vi.fn((_channels: number, frames: number) => ({ getChannelData: () => new Float32Array(frames) })) };
const music = { play: vi.fn(async () => {}), pause: vi.fn(), load: vi.fn(), removeAttribute: vi.fn(), addEventListener: vi.fn(), volume: 0, loop: false, preload: "" };
const AudioCtor = vi.fn(function () { return music; });
const ContextCtor = vi.fn(function () { return ctx; });
beforeEach(() => { vi.clearAllMocks(); ctx.resume.mockResolvedValue(undefined); vi.stubGlobal("Audio", AudioCtor); vi.stubGlobal("AudioContext", ContextCtor); });
afterEach(() => vi.unstubAllGlobals());
it("does not create or play audio before explicit enable, even with saved unmuted preferences", () => {
  const manager = new AudioManager({ ...DEFAULT_PREFERENCES, muted: false }, vi.fn());
  manager.update({ ...DEFAULT_PREFERENCES, muted: false }); manager.play("ui");
  expect(AudioCtor).not.toHaveBeenCalled(); expect(ContextCtor).not.toHaveBeenCalled(); manager.dispose();
});
it("uses one music element and ambient source, independent volume, visibility suspension and complete cleanup", async () => {
  const manager = new AudioManager({ ...DEFAULT_PREFERENCES, muted: false, master: .5, music: .4 }, vi.fn());
  expect(await manager.enable()).toBe(true); await manager.enable();
  expect(AudioCtor).toHaveBeenCalledTimes(1); expect(ContextCtor).toHaveBeenCalledTimes(1);
  expect(ctx.createBufferSource).toHaveBeenCalledTimes(1);
  expect(music.volume).toBeCloseTo(.11); manager.play("chips"); expect(ctx.createOscillator).toHaveBeenCalledTimes(1);
  manager.setInactive(true); manager.play("chips"); expect(ctx.createOscillator).toHaveBeenCalledTimes(1);
  expect(music.pause).toHaveBeenCalled(); expect(ctx.suspend).toHaveBeenCalled();
  manager.setInactive(false); expect(ctx.resume).toHaveBeenCalledTimes(3);
  manager.dispose(); expect(music.removeAttribute).toHaveBeenCalledWith("src"); expect(music.load).toHaveBeenCalled(); expect(ctx.close).toHaveBeenCalledTimes(1);
  expect(await manager.enable()).toBe(false);
});
it("prevents async enable from resurrecting music after unmount", async () => {
  let resolve!: () => void;
  ctx.resume.mockImplementationOnce(() => new Promise<void>((done) => { resolve = done; }));
  const manager = new AudioManager({ ...DEFAULT_PREFERENCES, muted: false }, vi.fn());
  const pending = manager.enable(); manager.dispose(); resolve();
  expect(await pending).toBe(false); expect(AudioCtor).not.toHaveBeenCalled();
});
it("reports autoplay rejection without changing the game or throwing", async () => {
  const report = vi.fn(); music.play.mockRejectedValueOnce(new Error("blocked"));
  const manager = new AudioManager({ ...DEFAULT_PREFERENCES, muted: false }, report);
  await manager.enable(); await Promise.resolve();
  expect(report).toHaveBeenCalledWith(expect.stringContaining("blocked")); manager.dispose();
});
it("bundles a valid original 146-second PCM piece rather than a short loop", () => {
  const data = readFileSync("public/audio/midnight-study.wav");
  expect(data.toString("ascii", 0, 4)).toBe("RIFF"); expect(data.toString("ascii", 8, 12)).toBe("WAVE");
  expect(data.readUInt32LE(24)).toBe(22050); expect(data.readUInt16LE(34)).toBe(16);
  expect((data.length - 44) / 22050 / 2).toBe(146);
});
