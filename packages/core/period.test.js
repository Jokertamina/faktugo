import { strict as assert } from "node:assert";
import test from "node:test";
import { computePeriodFromDate } from "./period.js";

test("computePeriodFromDate month mode", () => {
  const info = computePeriodFromDate("2025-02-14", "month", "/FaktuGo");
  assert.equal(info.period_type, "month");
  assert.equal(info.period_key, "2025-02");
  assert.equal(info.folder_path, "/FaktuGo/2025-02");
});

test("computePeriodFromDate week mode", () => {
  const info = computePeriodFromDate("2025-02-14", "week", "/FaktuGo");
  assert.equal(info.period_type, "week");
  assert.ok(info.period_key.startsWith("2025-S"));
  assert.ok(info.folder_path.startsWith("/FaktuGo/2025-S"));
});
