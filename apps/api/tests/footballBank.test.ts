import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { mapRecord } from "../src/services/importer";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const file = path.join(repoRoot, "data", "football", "football_core.json");
const qs = (JSON.parse(readFileSync(file, "utf-8")) as { questions: Record<string, unknown>[] }).questions;
const byType = (t: string) => qs.filter((q) => q.type === t);

describe("football winners-core", () => {
  it("loads and covers all four modes", () => {
    expect(qs.length).toBeGreaterThan(300);
    for (const t of ["fastest_answer", "who_am_i", "true_false", "enumeration"]) {
      expect(byType(t).length).toBeGreaterThan(0);
    }
  });

  it("true/false is balanced", () => {
    const tf = byType("true_false");
    const t = tf.filter((q) => q.answer === "صح").length;
    expect(Math.abs(t - tf.length / 2)).toBeLessThanOrEqual(5);
  });

  it("known champions are correct (verified tables)", () => {
    const ans = (sub: string) => (byType("fastest_answer").find((q) => String(q.question).includes(sub))?.answer as string);
    expect(byType("fastest_answer").find((q) => String(q.question).includes("الإنجليزي") && String(q.question).includes("2016"))?.answer).toBe("ليستر سيتي");
    expect(byType("fastest_answer").find((q) => String(q.question).includes("كأس العالم") && String(q.question).includes("2022"))?.answer).toBe("الأرجنتين");
    expect(ans("يورو 2024")).toBe("إسبانيا");
  });

  it("enumeration imports as answer GROUPS with aliases (not separate answers)", () => {
    let withAlias = 0;
    for (const raw of byType("enumeration")) {
      const r = mapRecord(raw, "football");
      expect(r.value, `${r.originalId} should map`).not.toBeNull();
      const groups = r.value!.answerGroups;
      expect(groups.length).toBeGreaterThan(1);
      // canonical never appears inside its own aliases
      for (const g of groups) expect(g.aliases).not.toContain(g.canonical);
      if (groups.some((g) => g.aliases.length > 0)) withAlias++;
    }
    // Clubs carry aliases (e.g. "Manchester United"), so most enum groups have them.
    expect(withAlias).toBeGreaterThan(5);
  });

  it("all modes map through the importer", () => {
    for (const t of ["fastest_answer", "who_am_i", "true_false", "enumeration"]) {
      for (const raw of byType(t).slice(0, 8)) {
        expect(mapRecord(raw, "football").value, `${t} should map`).not.toBeNull();
      }
    }
  });
});
