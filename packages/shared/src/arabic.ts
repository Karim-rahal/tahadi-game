/**
 * Arabic text normalization used for answer matching.
 *
 * The judge is the final authority (they can manually accept/reject), but these
 * helpers power the "does this typed/selected answer match an accepted answer"
 * check used by the enumeration checklist and the fastest-answer helper.
 *
 * Normalization is intentionally conservative — it removes diacritics,
 * tatweel, and punctuation, unifies alef/hamza/ya/ta-marbuta variants, strips
 * the definite article "ال", and collapses whitespace. It never translates or
 * transliterates. We keep the ORIGINAL text for display; only comparison uses
 * the normalized form.
 */

const ARABIC_DIACRITICS = /[ؗ-ًؚ-ْٰـ]/g; // harakat + tatweel
const PUNCTUATION = /[.,،؛;:!؟?"'`()[\]{}«»\-–—\/\\]/g;

export function stripTashkeel(input: string): string {
  return input.replace(ARABIC_DIACRITICS, "");
}

/** Full normalization for equality comparison. */
export function normalizeArabic(input: string): string {
  if (!input) return "";
  let s = input.normalize("NFKC");
  s = stripTashkeel(s);
  // Unify letter variants.
  s = s
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ء/g, "");
  // Convert Arabic-Indic digits to Latin for consistent comparison.
  s = s.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));
  s = s.replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
  // Drop punctuation.
  s = s.replace(PUNCTUATION, " ");
  // Strip a leading definite article from each whitespace token.
  s = s
    .split(/\s+/)
    .map((w) => (w.length > 3 && w.startsWith("ال") ? w.slice(2) : w))
    .join(" ");
  return s.replace(/\s+/g, " ").trim();
}

/**
 * Does `candidate` match any string in `accepted` after normalization?
 * Returns the matched accepted string (original form) or null.
 */
export function matchAccepted(candidate: string, accepted: readonly string[]): string | null {
  const c = normalizeArabic(candidate);
  if (!c) return null;
  for (const a of accepted) {
    if (normalizeArabic(a) === c) return a;
  }
  return null;
}

/** Deduplicate a list of answers by their normalized form, keeping first seen. */
export function dedupeNormalized(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of values) {
    const n = normalizeArabic(v);
    if (!n || seen.has(n)) continue;
    seen.add(n);
    out.push(v);
  }
  return out;
}
