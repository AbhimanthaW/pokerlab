import {
  CATEGORIES,
  type Card,
  type ExerciseKind,
  type ExerciseRecord,
  type HandCategory,
  type Settings,
} from "../domain/types";

export const STORAGE_KEY = "pokerlab.v1";
export const HISTORY_LIMIT = 500;
export const DEFAULT_SETTINGS: Settings = {
  opponents: 2,
  difficulty: "standard",
  animation: "normal",
  reducedMotion: false,
  fourColor: false,
};
export interface Counts {
  correct: number;
  incorrect: number;
  skipped: number;
}
export interface LifetimeTotals extends Counts {
  byKind: Record<ExerciseKind, Counts>;
  missed: Record<HandCategory, number>;
}
export interface AppData {
  settings: Settings;
  records: ExerciseRecord[];
  totals: LifetimeTotals;
}
export interface StoredData extends AppData {
  warning?: string;
}
const kinds: ExerciseKind[] = [
  "recognition",
  "best-five",
  "comparison",
  "prediction",
];
const statuses = ["correct", "incorrect", "skipped"] as const;
const suits = ["clubs", "diamonds", "hearts", "spades"] as const;
const suitLetters = { clubs: "c", diamonds: "d", hearts: "h", spades: "s" };
const rankLabels: Record<number, string> = {
  11: "J",
  12: "Q",
  13: "K",
  14: "A",
  10: "T",
};
function object(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function text(value: unknown, max: number): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= max;
}
function category(value: unknown): value is HandCategory {
  return CATEGORIES.some((item) => item === value);
}
function validCard(value: unknown): value is Card {
  if (
    !object(value) ||
    typeof value.rank !== "number" ||
    !Number.isInteger(value.rank) ||
    value.rank < 2 ||
    value.rank > 14
  )
    return false;
  const suit = suits.find((item) => item === value.suit);
  return (
    suit !== undefined &&
    value.id === `${rankLabels[value.rank] ?? value.rank}${suitLetters[suit]}`
  );
}
function validSettings(value: unknown): value is Settings {
  return (
    object(value) &&
    typeof value.opponents === "number" &&
    Number.isInteger(value.opponents) &&
    value.opponents >= 1 &&
    value.opponents <= 5 &&
    ["beginner", "standard", "challenge"].some(
      (item) => item === value.difficulty,
    ) &&
    ["slow", "normal", "fast"].some((item) => item === value.animation) &&
    typeof value.reducedMotion === "boolean" &&
    typeof value.fourColor === "boolean"
  );
}
function validRecord(value: unknown): value is ExerciseRecord {
  if (
    !object(value) ||
    !text(value.id, 200) ||
    !kinds.some((kind) => kind === value.kind) ||
    !statuses.some((status) => status === value.status) ||
    typeof value.timestamp !== "number" ||
    !Number.isSafeInteger(value.timestamp) ||
    value.timestamp < 0 ||
    value.timestamp > 8_640_000_000_000_000 ||
    !text(value.context, 2000) ||
    !text(value.explanation, 6000)
  )
    return false;
  if (value.expectedCategory !== undefined && !category(value.expectedCategory))
    return false;
  if (
    value.bestFive !== undefined &&
    (!Array.isArray(value.bestFive) ||
      value.bestFive.length !== 5 ||
      !value.bestFive.every(validCard) ||
      new Set(value.bestFive.map((card) => card.id)).size !== 5)
  )
    return false;
  return true;
}
function cleanSettings(value: Settings): Settings {
  return {
    opponents: value.opponents,
    difficulty: value.difficulty,
    animation: value.animation,
    reducedMotion: value.reducedMotion,
    fourColor: value.fourColor,
  };
}
function cleanRecord(value: ExerciseRecord): ExerciseRecord {
  return {
    id: value.id,
    kind: value.kind,
    timestamp: value.timestamp,
    context: value.context,
    status: value.status,
    explanation: value.explanation,
    ...(value.expectedCategory
      ? { expectedCategory: value.expectedCategory }
      : {}),
    ...(value.bestFive
      ? {
          bestFive: value.bestFive.map((card) => ({
            id: card.id,
            rank: card.rank,
            suit: card.suit,
          })),
        }
      : {}),
  };
}
function bounded(records: ExerciseRecord[]): ExerciseRecord[] {
  const unique = new Map<string, ExerciseRecord>();
  for (const record of records)
    if (!unique.has(record.id)) unique.set(record.id, cleanRecord(record));
  return [...unique.values()].slice(-HISTORY_LIMIT);
}
export const EMPTY_TOTALS: LifetimeTotals = {
  correct: 0,
  incorrect: 0,
  skipped: 0,
  byKind: {
    recognition: { correct: 0, incorrect: 0, skipped: 0 },
    "best-five": { correct: 0, incorrect: 0, skipped: 0 },
    comparison: { correct: 0, incorrect: 0, skipped: 0 },
    prediction: { correct: 0, incorrect: 0, skipped: 0 },
  },
  missed: {
    "High Card": 0,
    "One Pair": 0,
    "Two Pair": 0,
    "Three of a Kind": 0,
    Straight: 0,
    Flush: 0,
    "Full House": 0,
    "Four of a Kind": 0,
    "Straight Flush": 0,
  },
};
function newTotals(): LifetimeTotals {
  return structuredClone(EMPTY_TOTALS);
}
function fresh(warning?: string): StoredData {
  return {
    settings: { ...DEFAULT_SETTINGS },
    records: [],
    totals: newTotals(),
    ...(warning ? { warning } : {}),
  };
}
function nonnegative(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}
function validCounts(value: unknown): value is Counts {
  return (
    object(value) &&
    statuses.every((status) => nonnegative(value[status])) &&
    Number.isSafeInteger(
      Number(value.correct) + Number(value.incorrect) + Number(value.skipped),
    )
  );
}
function totalsFrom(records: ExerciseRecord[]): LifetimeTotals {
  const totals = newTotals();
  for (const record of records) {
    totals[record.status]++;
    totals.byKind[record.kind][record.status]++;
    if (record.status === "incorrect" && record.expectedCategory)
      totals.missed[record.expectedCategory]++;
  }
  return totals;
}
function validTotals(
  value: unknown,
  records: ExerciseRecord[],
): value is LifetimeTotals {
  if (
    !validCounts(value) ||
    !object(value) ||
    !object(value.byKind) ||
    !object(value.missed)
  )
    return false;
  const byKind = value.byKind;
  const missed = value.missed;
  if (
    !kinds.every((kind) => validCounts(byKind[kind])) ||
    !CATEGORIES.every((item) => nonnegative(missed[item]))
  )
    return false;
  for (const status of statuses) {
    if (
      kinds.reduce((sum, kind) => {
        const counts = byKind[kind];
        return sum + (validCounts(counts) ? counts[status] : 0);
      }, 0) !== value[status]
    )
      return false;
  }
  if (
    CATEGORIES.reduce((sum, item) => sum + Number(missed[item]), 0) >
    value.incorrect
  )
    return false;
  const recent = totalsFrom(records);
  if (statuses.some((status) => value[status] < recent[status])) return false;
  return (
    kinds.every((kind) => {
      const counts = byKind[kind];
      return (
        validCounts(counts) &&
        statuses.every(
          (status) => counts[status] >= recent.byKind[kind][status],
        )
      );
    }) &&
    CATEGORIES.every((item) => Number(missed[item]) >= recent.missed[item])
  );
}
function cleanTotals(value: LifetimeTotals): LifetimeTotals {
  const cleaned = newTotals();
  for (const status of statuses) cleaned[status] = value[status];
  for (const kind of kinds)
    for (const status of statuses)
      cleaned.byKind[kind][status] = value.byKind[kind][status];
  for (const item of CATEGORIES) cleaned.missed[item] = value.missed[item];
  return cleaned;
}
/** A result is recorded once. Session-generated UUIDs prevent collisions across reloads. */
export function appendRecord(data: AppData, record: ExerciseRecord): AppData {
  if (!validRecord(record)) throw new TypeError("Invalid exercise result");
  if (data.records.some((item) => item.id === record.id)) return data;
  const totals = structuredClone(data.totals);
  totals[record.status]++;
  totals.byKind[record.kind][record.status]++;
  if (record.status === "incorrect" && record.expectedCategory)
    totals.missed[record.expectedCategory]++;
  return {
    settings: data.settings,
    records: bounded([...data.records, record]),
    totals,
  };
}

/** Schema 1 retains lifetime counts and the most recent 500 detailed educational results. */
export function loadData(storage?: Storage): StoredData {
  try {
    const source = storage ?? window.localStorage;
    const raw = source.getItem(STORAGE_KEY);
    if (raw === null) return fresh();
    if (raw.length > 8_000_000)
      return fresh(
        "Stored progress is too large to read safely. A fresh local session has been started.",
      );
    const parsed: unknown = JSON.parse(raw);
    if (!object(parsed) || parsed.version !== 1)
      return fresh(
        "Stored progress uses an unsupported format. A fresh local session has been started.",
      );
    if (!validSettings(parsed.settings))
      return fresh(
        "Stored settings were damaged. Default settings and fresh progress have been loaded.",
      );
    if (!Array.isArray(parsed.records) || !parsed.records.every(validRecord))
      return {
        settings: cleanSettings(parsed.settings),
        records: [],
        totals: newTotals(),
        warning:
          "Stored progress was damaged. Your settings were recovered, and fresh progress has been loaded.",
      };
    const records = bounded(parsed.records);
    if (!validTotals(parsed.totals, records))
      return {
        settings: cleanSettings(parsed.settings),
        records,
        totals: totalsFrom(records),
        warning:
          "Lifetime totals were unavailable or damaged. Counts were rebuilt from your retained history.",
      };
    return {
      settings: cleanSettings(parsed.settings),
      records,
      totals: cleanTotals(parsed.totals),
    };
  } catch {
    return fresh(
      "Local storage could not be read. You can keep practicing; progress may not survive a reload.",
    );
  }
}

export function saveData(data: AppData, storage?: Storage): string | undefined {
  try {
    if (
      !validSettings(data.settings) ||
      !Array.isArray(data.records) ||
      !data.records.every(validRecord) ||
      !validTotals(data.totals, bounded(data.records))
    )
      return "Progress could not be saved because its format is invalid.";
    const target = storage ?? window.localStorage;
    target.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        settings: cleanSettings(data.settings),
        records: bounded(data.records),
        totals: cleanTotals(data.totals),
      }),
    );
    return undefined;
  } catch {
    return "Progress could not be saved on this device. You can keep practicing, but this session may not survive a reload.";
  }
}
export interface CategorySummary {
  completed: number;
  correct: number;
  incorrect: number;
  skipped: number;
  accuracy: number | null;
}
export interface ProgressSummary extends CategorySummary {
  byKind: Record<ExerciseKind, CategorySummary>;
}
function count(counts: Counts): CategorySummary {
  const { correct, incorrect, skipped } = counts;
  return {
    completed: correct + incorrect,
    correct,
    incorrect,
    skipped,
    accuracy: correct + incorrect ? correct / (correct + incorrect) : null,
  };
}
export function summarize(
  records: ExerciseRecord[],
  lifetimeTotals?: LifetimeTotals,
): ProgressSummary {
  const totals = lifetimeTotals ?? totalsFrom(bounded(records));
  return {
    ...count(totals),
    byKind: {
      recognition: count(totals.byKind.recognition),
      "best-five": count(totals.byKind["best-five"]),
      comparison: count(totals.byKind.comparison),
      prediction: count(totals.byKind.prediction),
    },
  };
}
