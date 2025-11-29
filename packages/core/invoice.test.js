import { strict as assert } from "node:assert";
import test from "node:test";
import { withPeriodInfo } from "./invoice.js";

test("withPeriodInfo adds period fields", () => {
  const base = {
    id: "1",
    date: "2025-02-14",
    supplier: "REPSOL",
    category: "Gasolina",
    amount: "45.60 EUR",
    status: "Enviada",
  };

  const result = withPeriodInfo(base, "month", "/FaktuGo");

  assert.equal(result.id, base.id);
  assert.equal(result.date, base.date);
  assert.equal(result.period_type, "month");
  assert.equal(result.period_key, "2025-02");
  assert.equal(result.folder_path, "/FaktuGo/2025-02");
});
