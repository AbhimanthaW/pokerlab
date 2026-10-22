import type { LabScenario, Distribution } from "../../domain/probability-lab/engine";
export interface LabRequest { id: number; scenario: LabScenario; mode: "exact" | "simulation"; samples: number; seed: number }
export type LabResponse = { id: number; type: "progress"; done: number; total: number } | { id: number; type: "result"; result: Distribution } | { id: number; type: "error"; message: string };
