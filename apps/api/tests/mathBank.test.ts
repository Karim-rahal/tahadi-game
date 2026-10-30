import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { difficultyFromArabic, questionTypeFromArabic } from "@darundi/shared";
import { mapRecord } from "../src/services/importer";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const file = path.join(repoRoot, "data", "mathematics", "fast_mathematics_600.json");
const bank = JSON.parse(readFileSync(file, "utf-8")) as { questions: Record<string, unknown>[] };
const qs = bank.questions;

/** Deterministically evaluate a pure arithmetic expression, or null. */
function evalExpr(raw: string): number | null {
  const digits: Record<string, string> = { "٠":"0","١":"1","٢":"2","٣":"3","٤":"4","٥":"5","٦":"6","٧":"7","٨":"8","٩":"9" };
  let s = raw.replace(/[٠-٩]/g, (d) => digits[d]!);
  s = s.replace(/[؟?=]/g, " ").replace(/×/g, "*").replace(/÷/g, "/").replace(/[−–—]/g, "-");
  const m = s.match(/[-+*/(). 0-9]+/);
  if (!m) return null;
  const expr = m[0].trim();
  if (!/[-+*/]/.test(expr)) return null;
  try {
    const v = Function(`"use strict";return (${expr})`)() as unknown;
    return typeof v === "number" && Number.isFinite(v) ? v : null;
  } catch {
    return null;
  }
}

describe("fast-mathematics bank", () => {
  it("has exactly 600 questions", () => {
    expect(qs.length).toBe(600);
  });

  it("matches the required difficulty distribution", () => {
    const by: Record<string, number> = {};
    for (const q of qs) by[q.difficulty as string] = (by[q.difficulty as string] ?? 0) + 1;
    expect(by).toEqual({ easy: 180, medium: 240, hard: 180 });
  });

  it("is all fastest-answer, with unique ids and unique question text", () => {
    const ids = new Set<string>();
    const texts = new Set<string>();
    for (const q of qs) {
      expect(q.type).toBe("fastest_answer");
      ids.add(q.id as string);
      texts.add((q.question as string).replace(/\s+/g, " ").trim());
      expect(String(q.answer ?? "").length).toBeGreaterThan(0);
      expect(Array.isArray(q.accepted_answers) && (q.accepted_answers as unknown[]).length).toBeTruthy();
    }
    expect(ids.size).toBe(600);
    expect(texts.size).toBe(600);
  });

  it("every pure-arithmetic question computes to its stated answer", () => {
    let checked = 0;
    for (const q of qs) {
      const got = evalExpr(q.question as string);
      if (got === null) continue; // word problem / pattern — not a pure expression
      checked++;
      expect(Math.round(got)).toBe(Number(q.answer));
    }
    // A meaningful share must be deterministically re-verified here.
    expect(checked).toBeGreaterThan(250);
  });

  it("imports cleanly through the importer (English enums map correctly)", () => {
    const sample = qs.slice(0, 50);
    for (const raw of sample) {
      const r = mapRecord(raw, "mathematics");
      expect(r.value, `record ${r.originalId} should map`).not.toBeNull();
      expect(r.value!.type).toBe("FASTEST");
    }
  });
});

describe("enum mappers accept the English question-bank format", () => {
  it("maps English type and difficulty values", () => {
    expect(questionTypeFromArabic("fastest_answer")).toBe("FASTEST");
    expect(questionTypeFromArabic("who_am_i")).toBe("WHO_AM_I");
    expect(questionTypeFromArabic("true_false")).toBe("TRUE_FALSE");
    expect(questionTypeFromArabic("enumeration")).toBe("ENUMERATE");
    expect(difficultyFromArabic("easy")).toBe("EASY");
    expect(difficultyFromArabic("medium")).toBe("MEDIUM");
    expect(difficultyFromArabic("hard")).toBe("HARD");
  });
});
