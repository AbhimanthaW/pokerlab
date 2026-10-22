import { useEffect, useRef, useState } from "react";
import type { Distribution, LabScenario } from "../../domain/probability-lab/engine";
import type { LabResponse } from "./protocol";
export function useCalculation() {
  const worker = useRef<Worker | null>(null), request = useRef(0);
  const [state, setState] = useState<{ busy: boolean; progress: number; error?: string; cancelled?: boolean; exact?: Distribution; simulation?: Distribution }>({ busy: false, progress: 0 });
  const terminate = () => { worker.current?.terminate(); worker.current = null; request.current++; };
  useEffect(() => () => { worker.current?.terminate(); worker.current = null; request.current++; }, []);
  const reset = () => { terminate(); setState({ busy: false, progress: 0 }); };
  const cancel = () => { terminate(); setState((s) => ({ ...s, busy: false, cancelled: true })); };
  const run = (scenario: LabScenario, mode: "exact" | "simulation", samples: number, seed: number) => {
    terminate(); const id = request.current;
    setState((s) => ({ ...s, busy: true, progress: 0, error: undefined, cancelled: false }));
    try {
      const w = new Worker(new URL("./lab.worker.ts", import.meta.url), { type: "module" }); worker.current = w;
      const failed = (message: string) => { if (id !== request.current) return; terminate(); setState((s) => ({ ...s, busy: false, error: message })); };
      w.onerror = () => failed("The probability worker could not run. Your scenario is retained; retry the calculation.");
      w.onmessage = ({ data }: MessageEvent<LabResponse>) => {
        if (data.id !== id || request.current !== id) return;
        if (data.type === "progress") setState((s) => ({ ...s, progress: data.done / data.total }));
        else if (data.type === "error") failed(data.message);
        else { terminate(); setState((s) => ({ ...s, busy: false, progress: 1, [data.result.method]: data.result })); }
      };
      w.postMessage({ id, scenario: structuredClone(scenario), mode, samples, seed });
    } catch { terminate(); setState((s) => ({ ...s, busy: false, error: "Web Workers are unavailable. Scenario editing and exact next-card probabilities remain available." })); }
  };
  return { ...state, run, cancel, reset };
}
