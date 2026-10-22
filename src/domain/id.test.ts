import { expect, it } from "vitest";
import { uniqueId } from "./id";
it("generates distinct Web Crypto UUIDv4 values without relying on randomUUID", () => {
  const values = Array.from({ length: 1000 }, uniqueId);
  expect(new Set(values).size).toBe(1000);
  expect(
    values.every((v) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(
        v,
      ),
    ),
  ).toBe(true);
});
