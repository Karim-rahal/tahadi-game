import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { mapRecord } from "../src/services/importer";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const file = path.join(repoRoot, "data", "football", "football_1200.json");
const qs = (JSON.parse(readFileSync(file, "utf-8")) as { questions: Record<string, unknown>[] }).questions;
const byType = (t: string) => qs.filter((q) => q.type === t);

describe("football bank (1200)", () => {
  it("has 1200 questions, 300 per mode", () => {
    expect(qs.length).toBe(1200);
    for (const t of ["fastest_answer", "who_am_i", "true_false", "enumeration"]) {
      expect(byType(t).length).toBe(300);
    }
  });

  it("true/false is balanced", () => {
    const tf = byType("true_false");
    const t = tf.filter((q) => (q.canonicalAnswer ?? q.answer) === "صح").length;
    expect(Math.abs(t - tf.length / 2)).toBeLessThanOrEqual(10);
  });

  it("EVERY question maps through the importer (camelCase fields, 0 skips)", () => {
    const skipped = qs.map((raw) => mapRecord(raw, "football")).filter((r) => !r.value);
    expect(skipped.length, `skipped: ${skipped.slice(0, 3).map((s) => s.originalId + " " + s.errors.join(";")).join(" | ")}`).toBe(0);
  });

  it("enumeration maps to answer GROUPS with club aliases", () => {
    let withAlias = 0;
    for (const raw of byType("enumeration")) {
      const g = mapRecord(raw, "football").value!.answerGroups;
      expect(g.length).toBeGreaterThan(0);
      for (const grp of g) expect(grp.aliases).not.toContain(grp.canonical);
      if (g.some((grp) => grp.aliases.length > 0)) withAlias++;
    }
    expect(withAlias).toBeGreaterThan(50);
  });

  it("verified winner answers are correct", () => {
    const fa = byType("fastest_answer");
    const a = (needle: string) => fa.find((q) => String(q.question).includes(needle))?.canonicalAnswer;
    expect(a("الدوري الإيطالي") && String(fa.find((q) => String(q.question).includes("الإيطالي") && String(q.question).includes("2003"))?.canonicalAnswer)).toBe("يوفنتوس");
    expect(fa.find((q) => String(q.question).includes("الإنجليزي") && String(q.question).includes("2016"))?.canonicalAnswer).toBe("ليستر سيتي");
  });
});
