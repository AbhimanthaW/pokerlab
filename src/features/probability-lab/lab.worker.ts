import { exactDistribution, simulateDistribution } from "../../domain/probability-lab/engine";
import type { LabRequest, LabResponse } from "./protocol";
// Dedicated worker: termination is immediate cancellation even inside evaluator work.
self.onmessage = ({ data }: MessageEvent<LabRequest>) => {
  const send = (response: LabResponse) => self.postMessage(response);
  try {
    const run = data.mode === "exact" ? exactDistribution(data.scenario) : simulateDistribution(data.scenario, data.samples, data.seed);
    let step = run.next(), lastProgress = -Infinity;
    while (!step.done) {
      const now = performance.now();
      if (now - lastProgress >= 50) { send({ id: data.id, type: "progress", ...step.value }); lastProgress = now; }
      step = run.next();
    }
    send({ id: data.id, type: "result", result: step.value });
  } catch (e) { send({ id: data.id, type: "error", message: e instanceof Error ? e.message : "Calculation failed" }); }
};
