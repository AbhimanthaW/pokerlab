import { describe, expect, it } from "vitest";
import {
  appendRecord,
  DEFAULT_SETTINGS,
  EMPTY_TOTALS,
  HISTORY_LIMIT,
  loadData,
  saveData,
  STORAGE_KEY,
  summarize,
  type AppData,
} from "./storage";
import type { ExerciseRecord } from "../domain/types";
function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
    removeItem: (key: string) => {
      values.delete(key);
    },
    clear: () => values.clear(),
    key: (index: number) => [...values.keys()][index] ?? null,
    get length() {
      return values.size;
    },
  } satisfies Storage;
}
function fresh(): AppData {
  return {
    settings: { ...DEFAULT_SETTINGS },
    records: [],
    totals: structuredClone(EMPTY_TOTALS),
  };
}
function record(
  id = "1",
  status: ExerciseRecord["status"] = "correct",
): ExerciseRecord {
  return {
    id,
    kind: "recognition",
    status,
    timestamp: 100,
    context: "Flop hand recognition",
    explanation: "The best five cards form one pair.",
    expectedCategory: "One Pair",
  };
}
describe("local progress schema and counting", () => {
  it("provides independent defaults for a missing record", () => {
    const store = memoryStorage();
    const first = loadData(store);
    first.settings.opponents = 5;
    first.totals.correct = 5;
    expect(loadData(store)).toEqual({ ...fresh() });
  });
  it("round trips preferences, records and lifetime totals", () => {
    const store = memoryStorage();
    const data = appendRecord(fresh(), record());
    data.settings.opponents = 5;
    expect(saveData(data, store)).toBeUndefined();
    expect(loadData(store)).toEqual(data);
  });
  it("deduplicates an exercise result without changing the source", () => {
    const source = fresh();
    const once = appendRecord(source, record());
    expect(appendRecord(once, record())).toBe(once);
    expect(source.records).toHaveLength(0);
    expect(source.totals.correct).toBe(0);
  });
  it("does not count skips as incorrect or completed; accuracy excludes them", () => {
    let data = fresh();
    data = appendRecord(data, record("a", "correct"));
    data = appendRecord(data, record("b", "incorrect"));
    data = appendRecord(data, record("c", "skipped"));
    const stats = summarize(data.records, data.totals);
    expect(stats).toMatchObject({
      completed: 2,
      correct: 1,
      incorrect: 1,
      skipped: 1,
      accuracy: 0.5,
    });
    expect(stats.byKind.recognition.accuracy).toBe(0.5);
    expect(data.totals.missed["One Pair"]).toBe(1);
  });
  it("has no invented accuracy before answering", () => {
    expect(summarize([]).accuracy).toBeNull();
    expect(summarize([record("a", "skipped")]).accuracy).toBeNull();
  });
  it("bounds detailed history without losing lifetime counts across reload", () => {
    const store = memoryStorage();
    let data = fresh();
    for (let index = 0; index < 530; index++)
      data = appendRecord(data, record(String(index)));
    expect(data.records).toHaveLength(HISTORY_LIMIT);
    expect(data.records[0].id).toBe("30");
    expect(saveData(data, store)).toBeUndefined();
    const recovered = loadData(store);
    expect(summarize(recovered.records, recovered.totals).completed).toBe(530);
    expect(recovered.records).toHaveLength(500);
  });
  it("recovers valid settings when detailed records are corrupt", () => {
    const store = memoryStorage();
    store.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        settings: { ...DEFAULT_SETTINGS, opponents: 4 },
        records: [{ ...record(), timestamp: "yesterday" }],
      }),
    );
    expect(loadData(store)).toMatchObject({
      settings: { opponents: 4 },
      records: [],
    });
    expect(loadData(store).warning).toBeTruthy();
  });
  it("safely handles corrupted JSON and unsupported schema versions", () => {
    const store = memoryStorage();
    for (const value of [
      "{bad",
      JSON.stringify({ version: 99 }),
      "null",
      "[]",
    ]) {
      store.setItem(STORAGE_KEY, value);
      expect(loadData(store).records).toEqual([]);
      expect(loadData(store).warning).toBeTruthy();
    }
  });
  it.each([0, 6, 1.5, null, "2"])(
    "rejects invalid opponent setting %s",
    (opponents) => {
      const store = memoryStorage();
      store.setItem(
        STORAGE_KEY,
        JSON.stringify({
          ...fresh(),
          version: 1,
          settings: { ...DEFAULT_SETTINGS, opponents },
        }),
      );
      expect(loadData(store).settings.opponents).toBe(
        DEFAULT_SETTINGS.opponents,
      );
      expect(loadData(store).warning).toBeTruthy();
    },
  );
  it("rejects mismatched card ids, duplicated cards and invalid categories", () => {
    const store = memoryStorage();
    for (const patch of [
      { bestFive: [{ id: "Ah", rank: 2, suit: "hearts" }] },
      { expectedCategory: "Royal Flush" },
      { bestFive: Array(5).fill({ id: "Ah", rank: 14, suit: "hearts" }) },
    ]) {
      store.setItem(
        STORAGE_KEY,
        JSON.stringify({
          ...fresh(),
          version: 1,
          records: [{ ...record(), ...patch }],
        }),
      );
      expect(loadData(store).records).toEqual([]);
      expect(loadData(store).warning).toBeTruthy();
    }
  });
  it("rebuilds inconsistent totals from trustworthy detailed history", () => {
    const store = memoryStorage();
    const data = appendRecord(fresh(), record());
    store.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...data,
        version: 1,
        totals: { ...data.totals, correct: 500 },
      }),
    );
    expect(loadData(store).totals.correct).toBe(1);
    expect(loadData(store).warning).toBeTruthy();
  });
  it("rejects nonfinite values at save time", () => {
    const store = memoryStorage();
    const data = appendRecord(fresh(), record());
    data.records[0].timestamp = Infinity;
    expect(saveData(data, store)).toContain("invalid");
    expect(store.getItem(STORAGE_KEY)).toBeNull();
  });
  it("reports read and write storage denial while retaining in-memory use", () => {
    const store = memoryStorage();
    store.getItem = () => {
      throw new Error("denied");
    };
    store.setItem = () => {
      throw new Error("full");
    };
    expect(loadData(store).warning).toContain("could not be read");
    expect(saveData(fresh(), store)).toContain("could not be saved");
  });
  it("rejects unexpected runtime result shapes", () => {
    expect(() => appendRecord(fresh(), { ...record(), timestamp: -1 })).toThrow(
      "Invalid exercise result",
    );
  });
});
