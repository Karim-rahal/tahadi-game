import { describe, expect, it } from "vitest";
import { dedupeNormalized, matchAccepted, normalizeArabic } from "@darundi/shared";

describe("normalizeArabic", () => {
  it("strips tashkeel and unifies alef/ya/ta-marbuta", () => {
    expect(normalizeArabic("مُحَمَّد")).toBe(normalizeArabic("محمد"));
    expect(normalizeArabic("مكة")).toBe(normalizeArabic("مكه"));
    expect(normalizeArabic("موسى")).toBe(normalizeArabic("موسي"));
    expect(normalizeArabic("إبراهيم")).toBe(normalizeArabic("ابراهيم"));
  });

  it("drops the definite article for comparison", () => {
    expect(normalizeArabic("الصين")).toBe(normalizeArabic("صين"));
  });

  it("converts Arabic-Indic digits", () => {
    expect(normalizeArabic("٢٠٢٤")).toBe("2024");
  });

  it("ignores surrounding punctuation and whitespace", () => {
    expect(normalizeArabic("  غزوة بدر. ")).toBe(normalizeArabic("غزوة بدر"));
  });
});

describe("matchAccepted", () => {
  const accepted = ["كاتماندو", "موسكو", "النرويج"];
  it("matches regardless of diacritics / article", () => {
    expect(matchAccepted("كاتماندو", accepted)).toBe("كاتماندو");
    expect(matchAccepted("نرويج", accepted)).toBe("النرويج");
    expect(matchAccepted("باريس", accepted)).toBeNull();
  });
});

describe("dedupeNormalized", () => {
  it("removes normalized-duplicate answers keeping first form", () => {
    expect(dedupeNormalized(["مكة", "مكه", "المدينة"])).toEqual(["مكة", "المدينة"]);
  });
});
