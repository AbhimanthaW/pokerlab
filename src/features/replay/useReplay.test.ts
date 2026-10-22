import { act, renderHook } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { playbackReducer, useReplay } from "./useReplay";
afterEach(() => vi.useRealTimers());
it("steps, scrubs and restarts through absolute positions with safe bounds", () => {
  const state = { index: 3, playing: true, speed: 1 };
  expect(playbackReducer(state, { type: "seek", index: 1 }, 10)).toMatchObject({ index: 1, playing: false });
  expect(playbackReducer(state, { type: "seek", index: 100 }, 10).index).toBe(9);
  expect(playbackReducer(state, { type: "restart" }, 10)).toMatchObject({ index: 0, playing: false });
  expect(playbackReducer(state, { type: "speed", speed: 10 }, 10)).toMatchObject(state);
});
it("plays at selected speed, pauses while hidden and cancels timers on exit", () => {
  vi.useFakeTimers(); const hook = renderHook(({ active }) => useReplay(5, 1, active), { initialProps: { active: true } });
  act(() => hook.result.current.dispatch({ type: "toggle" }));
  act(() => vi.advanceTimersByTime(1100)); expect(hook.result.current.index).toBe(1);
  act(() => hook.result.current.dispatch({ type: "speed", speed: 2 }));
  act(() => vi.advanceTimersByTime(550)); expect(hook.result.current.index).toBe(2);
  hook.rerender({ active: false }); act(() => vi.advanceTimersByTime(5000)); expect(hook.result.current.index).toBe(2);
  hook.rerender({ active: true }); act(() => vi.advanceTimersByTime(550)); expect(hook.result.current.index).toBe(3);
  act(() => hook.result.current.dispatch({ type: "toggle" })); act(() => vi.advanceTimersByTime(550)); expect(hook.result.current.index).toBe(3);
  hook.unmount(); expect(vi.getTimerCount()).toBe(0);
});
it("changes speed without restarting the current visual event", () => {
  const state = { index: 3, playing: true, speed: 1, at: 50 };
  expect(playbackReducer(state, { type: "speed", speed: 2, at: 100 }, 10).at).toBe(50);
  expect(playbackReducer(state, { type: "toggle", at: 200 }, 10).at).toBe(50);
});
