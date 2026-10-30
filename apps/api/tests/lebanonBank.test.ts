import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { mapRecord } from "../src/services/importer";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const file = path.join(repoRoot, "data", "lebanon", "lebanon_600_playtest.json");
const qs = (JSON.parse(readFileSync(file, "utf-8")) as { questions: Record<string, unknown>[] }).questions;

const byType = (t: string) => qs.filter((q) => q.type === t);

function norm(s: string): string {
  return String(s)
    .trim()
    .replace(/[ً-ْ]/g, "")
    .replace(/[إأآا]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ـ/g, "")
    .replace(/\s+/g, " ")
    .replace(/^ال/, "")
    .trim();
}

// Lebanon's 8 governorates -> districts (أقضية).
const GOV: Record<string, string[]> = {
  "جبل لبنان": ["بعبدا", "عاليه", "الشوف", "كسروان", "المتن", "جبيل"],
  الشمال: ["طرابلس", "زغرتا", "بشري", "البترون", "الكورة", "المنية الضنية"],
  عكار: ["عكار"],
  البقاع: ["زحلة", "البقاع الغربي", "راشيا"],
  "بعلبك الهرمل": ["بعلبك", "الهرمل"],
  الجنوب: ["صيدا", "صور", "جزين"],
  النبطية: ["النبطية", "بنت جبيل", "مرجعيون", "حاصبيا"],
};
const GOVN = Object.fromEntries(Object.entries(GOV).map(([g, ds]) => [norm(g), ds.map(norm)]));

describe("lebanon bank", () => {
  it("has 600 questions, 150 per mode", () => {
    expect(qs.length).toBe(600);
    for (const t of ["fastest_answer", "who_am_i", "true_false", "enumeration"]) {
      expect(byType(t).length).toBe(150);
    }
  });

  it("true/false is reasonably balanced", () => {
    const tf = byType("true_false");
    const t = tf.filter((q) => /^(صح|صحيح)$/.test(String(q.answer).trim())).length;
    expect(t).toBeGreaterThanOrEqual(60);
    expect(t).toBeLessThanOrEqual(90);
  });

  it("every enumeration answer is within the shown options", () => {
    let bad = 0;
    for (const q of byType("enumeration")) {
      const m = String(q.question).match(/الخيارات:\s*(.+?)\.?\s*$/);
      if (!m) continue;
      const opts = m[1]!.split(/[،,]/).map(norm).filter(Boolean);
      const ans = (q.accepted_answers as string[]).map(norm);
      if (ans.some((a) => !opts.includes(a))) bad++;
    }
    expect(bad).toBe(0);
  });

  it("district/governorate enumerations are factually correct (deterministic)", () => {
    let mismatch = 0;
    let checked = 0;
    for (const q of byType("enumeration")) {
      if (!/الأقضية|أقضية/.test(String(q.question)) || !/الخيارات:/.test(String(q.question))) continue;
      const criterion = norm(String(q.question).split("الخيارات")[0]!);
      const govs = Object.keys(GOVN).filter((g) => criterion.includes(g));
      if (!govs.length) continue;
      checked++;
      const expected = new Set(govs.flatMap((g) => GOVN[g]!));
      const opts = String(q.question).match(/الخيارات:\s*(.+?)\.?\s*$/)![1]!.split(/[،,]/).map(norm).filter(Boolean);
      const want = opts.filter((o) => expected.has(o)).sort();
      const got = (q.accepted_answers as string[]).map(norm).sort();
      if (want.length !== got.length || !want.every((v, i) => v === got[i])) mismatch++;
    }
    expect(checked).toBeGreaterThan(40);
    expect(mismatch).toBe(0);
  });

  it("imports cleanly through the importer (all modes map)", () => {
    for (const t of ["fastest_answer", "who_am_i", "true_false", "enumeration"]) {
      for (const raw of byType(t).slice(0, 10)) {
        const r = mapRecord(raw, "lebanon");
        expect(r.value, `${r.originalId} should map`).not.toBeNull();
      }
    }
  });
});
