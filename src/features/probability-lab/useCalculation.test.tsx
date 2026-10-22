import { act, renderHook } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { parseCards } from "../../domain/cards";
import { useCalculation } from "./useCalculation";
class FakeWorker {
  static instances: FakeWorker[] = [];
  onmessage?: (e: { data: unknown }) => void; onerror?: () => void;
  terminate = vi.fn(); postMessage = vi.fn(); constructor() { FakeWorker.instances.push(this); }
}
afterEach(() => { vi.unstubAllGlobals(); FakeWorker.instances = []; });
it("cleans up workers on cancel/unmount and ignores stale responses across scenario resets", () => {
  vi.stubGlobal("Worker", FakeWorker);
  const hook = renderHook(useCalculation), scenario = { privateCards: parseCards("Ah Kh"), board: parseCards("Qh Jh 2c"), unavailable: [] };
  act(() => hook.result.current.run(scenario, "simulation", 5000, 42));
  const first = FakeWorker.instances[0], id = first.postMessage.mock.calls[0][0].id;
  act(() => first.onmessage?.({ data: { id, type: "progress", done: 100, total: 5000 } }));
  expect(hook.result.current.progress).toBe(.02);
  act(() => hook.result.current.cancel()); expect(first.terminate).toHaveBeenCalledOnce(); expect(hook.result.current.busy).toBe(false);
  act(() => first.onmessage?.({ data: { id, type: "result", result: { method: "simulation", counts: [10], total: 10 } } }));
  expect(hook.result.current.simulation).toBeUndefined();
  act(() => hook.result.current.run(scenario, "exact", 1000, 42));
  const second = FakeWorker.instances[1]; act(() => hook.result.current.reset()); expect(second.terminate).toHaveBeenCalledOnce();
  act(() => hook.result.current.run(scenario, "exact", 1000, 42)); hook.unmount(); expect(FakeWorker.instances[2].terminate).toHaveBeenCalledOnce();
});
it("retains exact and estimated results independently and terminates completed workers", () => {
  vi.stubGlobal("Worker", FakeWorker); const hook = renderHook(useCalculation);
  const scenario = { privateCards: parseCards("Ah Kh"), board: parseCards("Qh Jh Th 2c 3d"), unavailable: [] };
  for (const method of ["exact", "simulation"] as const) {
    act(() => hook.result.current.run(scenario, method, 1000, 42)); const w = FakeWorker.instances.at(-1)!, id = w.postMessage.mock.calls[0][0].id;
    act(() => w.onmessage?.({ data: { id, type: "result", result: { method, total: 1, counts: [0, 0, 0, 0, 0, 0, 0, 0, 1] } } })); expect(w.terminate).toHaveBeenCalledOnce();
  }
  expect(hook.result.current.exact).toBeDefined(); expect(hook.result.current.simulation).toBeDefined();
});
