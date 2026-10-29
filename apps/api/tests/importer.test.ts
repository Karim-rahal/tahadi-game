import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { analyzeRecords, mapRecord } from "../src/services/importer";

const religiousTF = {
  type: "صح أم خطأ",
  question: "غزوة بدر: وقعت في السنة الثانية للهجرة.",
  answer: "صح",
  accepted_answers: ["صح"],
  clues: [],
  explanation: "العبارة مطابقة للوصف.",
  id: "TF-001",
  difficulty: "سهل",
  review_status: "مسودة — لم تُراجع المصادر فردياً",
  source_verified: false,
  minimum_required: null,
};

const geographyTF = {
  id: "GEO-301",
  category: "بلاد العالم والجغرافيا",
  type: "صح أم خطأ",
  difficulty: "سهل",
  question: "تقع نيبال في آسيا.",
  answer: "صح",
  accepted_answers: ["صح"],
  clues: [],
  review_notes: "تُطرح على فريق واحد.",
  metadata: { is_true: true, explanation: "التصنيف: آسيا." },
};

describe("mapRecord — religious schema", () => {
  it("maps types/difficulty and derives isTrue from answer", () => {
    const r = mapRecord(religiousTF, "religious");
    expect(r.errors).toEqual([]);
    expect(r.value?.type).toBe("TRUE_FALSE");
    expect(r.value?.difficulty).toBe("EASY");
    expect(r.value?.isTrue).toBe(true);
    expect(r.value?.explanation).toContain("مطابقة");
    expect(r.value?.flaggedForReview).toBe(true); // draft
    expect(r.value?.sourceVerified).toBe(false); // never trusted
  });
});

describe("mapRecord — geography schema", () => {
  it("reads explanation/is_true from metadata", () => {
    const r = mapRecord(geographyTF, "geography");
    expect(r.errors).toEqual([]);
    expect(r.value?.isTrue).toBe(true);
    expect(r.value?.explanation).toBe("التصنيف: آسيا.");
    expect(r.value?.reviewNotes).toContain("فريق");
  });
});

describe("mapRecord — enumeration incompleteness", () => {
  it("flags lists shorter than minimum_required", () => {
    const r = mapRecord(
      {
        type: "عدّد الإجابات",
        question: "عدّد س",
        answer: "أ؛ ب",
        accepted_answers: ["أ", "ب"],
        clues: [],
        id: "LIST-X",
        difficulty: "متوسط",
        minimum_required: 5,
      },
      "religious",
    );
    expect(r.value?.acceptedAnswersIncomplete).toBe(true);
  });

  it("errors when an enumeration has no accepted answers", () => {
    const r = mapRecord(
      { type: "عدّد الإجابات", question: "س", answer: "", accepted_answers: [], clues: [], id: "LIST-Y", difficulty: "سهل" },
      "religious",
    );
    expect(r.value).toBeNull();
    expect(r.errors.length).toBeGreaterThan(0);
  });
});

describe("mapRecord — invalid records are skipped, not fabricated", () => {
  it("returns null value for an unknown type", () => {
    const r = mapRecord({ type: "نوع غريب", question: "س", answer: "ج", difficulty: "سهل", id: "X" }, "religious");
    expect(r.value).toBeNull();
    expect(r.errors.join(" ")).toContain("نوع");
  });
});

describe("analyzeRecords — duplicate detection", () => {
  it("flags exact duplicates without removing them", () => {
    const base = { type: "الأسرع يجاوب", question: "ما عاصمة مصر؟", answer: "القاهرة", accepted_answers: ["القاهرة"], clues: [], difficulty: "سهل" };
    const { mapped, duplicates } = analyzeRecords(
      [
        { ...base, id: "A1" },
        { ...base, id: "A2" },
      ],
      "geography",
    );
    expect(mapped).toHaveLength(2);
    expect(duplicates).toHaveLength(1);
    expect(duplicates[0]?.originalIds).toEqual(["A1", "A2"]);
    // Second one carries a duplicate warning; both are still present.
    expect(mapped[1]?.warnings.some((w) => w.includes("مكرر"))).toBe(true);
  });
});

describe("real data files import cleanly (structural)", () => {
  function load(rel: string) {
    const p = fileURLToPath(new URL(rel, import.meta.url));
    return JSON.parse(readFileSync(p, "utf-8")).questions as Record<string, unknown>[];
  }

  it("religious: 600 records, 0 structural errors", () => {
    const qs = load("../../../data/religious/religious_questions_600_draft.json");
    expect(qs).toHaveLength(600);
    const { mapped } = analyzeRecords(qs, "religious");
    expect(mapped.filter((m) => !m.value)).toHaveLength(0);
  });

  it("geography: 600 records, 0 structural errors", () => {
    const qs = load("../../../data/geography/geography_600_playtest.json");
    expect(qs).toHaveLength(600);
    const { mapped } = analyzeRecords(qs, "geography");
    expect(mapped.filter((m) => !m.value)).toHaveLength(0);
  });
});
