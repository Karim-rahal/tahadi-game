import crypto from "node:crypto";
import {
  type Difficulty,
  type QuestionType,
  difficultyFromArabic,
  normalizeArabic,
  questionTypeFromArabic,
  trueFalseFromArabic,
  dedupeNormalized,
} from "@darundi/shared";

/**
 * The importer maps the two DIFFERENT source schemas (religious / geography)
 * onto one unified internal shape, validates structural (not factual) validity,
 * preserves all original metadata, and detects duplicates — without ever
 * deleting, rewriting, or fabricating content.
 */

export type SourceFile = "religious" | "geography";

export interface MappedQuestion {
  type: QuestionType;
  difficulty: Difficulty;
  questionText: string;
  answerText: string;
  acceptedAnswers: string[];
  clues: string[];
  explanation: string | null;
  isTrue: boolean | null;
  minimumRequired: number | null;
  topic: string | null;
  sect: string | null;
  sourceReference: string | null;
  sourceUrl: string | null;
  sourceVerified: boolean;
  reviewStatus: string | null;
  reviewNotes: string | null;
  flaggedForReview: boolean;
  acceptedAnswersIncomplete: boolean;
  originalId: string;
  contentHash: string;
  rawMetadata: unknown;
}

export interface MapResult {
  originalId: string;
  value: MappedQuestion | null;
  errors: string[];
  warnings: string[];
}

type RawRecord = Record<string, unknown>;

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}
function strOrNull(v: unknown): string | null {
  const s = str(v);
  return s.length ? s : null;
}
function arr(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => (typeof x === "string" ? x.trim() : String(x))).filter((x) => x.length > 0);
}

/** Markers in review_status that mean "needs review / draft". */
function isDraft(reviewStatus: string | null): boolean {
  if (!reviewStatus) return true; // unknown => be conservative, flag it
  return /مسودة|تحتاج|غير\s*مدقق|لم\s*تُراجع|review/i.test(reviewStatus);
}

export function computeContentHash(
  type: QuestionType,
  questionText: string,
  answerText: string,
): string {
  const basis = `${type}|${normalizeArabic(questionText)}|${normalizeArabic(answerText)}`;
  return crypto.createHash("sha256").update(basis).digest("hex");
}

/** Pure mapping from a raw record (either schema) to the unified shape. */
export function mapRecord(raw: RawRecord, sourceFile: SourceFile): MapResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const originalId = str(raw.id) || `${sourceFile}:unknown`;

  const type = questionTypeFromArabic(str(raw.type));
  const difficulty = difficultyFromArabic(str(raw.difficulty));
  const questionText = str(raw.question);
  const answerText = str(raw.answer);
  const acceptedAnswersRaw = arr(raw.accepted_answers);
  const clues = arr(raw.clues);

  if (!type) errors.push(`نوع غير معروف: "${str(raw.type)}"`);
  if (!difficulty) errors.push(`صعوبة غير معروفة: "${str(raw.difficulty)}"`);
  if (!questionText) errors.push("نص السؤال فارغ");
  if (!answerText && type !== "ENUMERATE") errors.push("الإجابة فارغة");

  // Geography nests several fields under `metadata`.
  const meta = (raw.metadata && typeof raw.metadata === "object" ? (raw.metadata as RawRecord) : {}) as RawRecord;

  const explanation = strOrNull(raw.explanation) ?? strOrNull(meta.explanation);
  const reviewNotes = strOrNull(raw.review_notes) ?? strOrNull(raw.note);
  const sourceReference = strOrNull(raw.source_reference) ?? strOrNull(raw.source);
  const sourceUrl = strOrNull(raw.source_url);
  const reviewStatus = strOrNull(raw.review_status);
  const topic = strOrNull(raw.topic);
  const sect = strOrNull(raw.sect);

  // minimum_required may be a number or null.
  const minRaw = raw.minimum_required;
  const minimumRequired = typeof minRaw === "number" && Number.isFinite(minRaw) ? minRaw : null;

  // Accepted answers: dedupe by normalized form, preserving original text/order.
  const acceptedAnswers = dedupeNormalized(acceptedAnswersRaw);
  if (acceptedAnswers.length !== acceptedAnswersRaw.length) {
    warnings.push("أُزيلت بدائل مكررة من قائمة الإجابات المقبولة");
  }

  // Determine isTrue for صح أم خطأ.
  let isTrue: boolean | null = null;
  if (type === "TRUE_FALSE") {
    if (typeof meta.is_true === "boolean") isTrue = meta.is_true;
    else isTrue = trueFalseFromArabic(answerText);
    if (isTrue === null) warnings.push("تعذّر تحديد صح/خطأ من الإجابة");
  }

  // Type-specific structural checks (never factual).
  if (type === "WHO_AM_I" && clues.length === 0) {
    warnings.push("سؤال «من أنا؟» بلا تلميحات");
  }
  if (type === "ENUMERATE" && acceptedAnswers.length === 0) {
    errors.push("سؤال «عدّد الإجابات» بلا قائمة إجابات مقبولة");
  }

  // Flag enumeration lists that look incomplete (do NOT pretend they are full).
  let acceptedAnswersIncomplete = false;
  if (type === "ENUMERATE") {
    if (minimumRequired != null && acceptedAnswers.length < minimumRequired) {
      acceptedAnswersIncomplete = true;
      warnings.push(
        `قائمة الإجابات أقل من الحد الأدنى (${acceptedAnswers.length}/${minimumRequired})`,
      );
    }
    if (/استكمال|مفتوحة|incomplete|ناقصة/i.test([reviewNotes, explanation].filter(Boolean).join(" "))) {
      acceptedAnswersIncomplete = true;
    }
  }

  // Any structural error is blocking: we skip (never fabricate) the record.
  if (errors.length > 0 || !type || !difficulty || !questionText) {
    return { originalId, value: null, errors, warnings };
  }

  const value: MappedQuestion = {
    type,
    difficulty,
    questionText,
    answerText: answerText || acceptedAnswers.join("؛ "),
    acceptedAnswers,
    clues,
    explanation,
    isTrue,
    minimumRequired,
    topic,
    sect,
    sourceReference,
    sourceUrl,
    // Policy: we never treat the source as fact-checked.
    sourceVerified: false,
    reviewStatus,
    reviewNotes,
    flaggedForReview: isDraft(reviewStatus),
    acceptedAnswersIncomplete,
    originalId,
    contentHash: computeContentHash(type, questionText, answerText),
    rawMetadata: raw,
  };
  return { originalId, value, errors, warnings };
}

export interface ImportReportRecord {
  originalId: string;
  status: "inserted" | "updated" | "skipped";
  errors: string[];
  warnings: string[];
}

export interface ImportReport {
  sourceFile: SourceFile;
  fileHash: string;
  totalRead: number;
  inserted: number;
  updated: number;
  skipped: number;
  byType: Record<string, number>;
  byDifficulty: Record<string, number>;
  duplicateContentHashes: { contentHash: string; originalIds: string[] }[];
  records: ImportReportRecord[];
  warnings: string[];
}

/** Analyze a parsed array of raw records (pure — no DB). */
export function analyzeRecords(
  rawQuestions: RawRecord[],
  sourceFile: SourceFile,
): { mapped: MapResult[]; duplicates: { contentHash: string; originalIds: string[] }[] } {
  const mapped = rawQuestions.map((r) => mapRecord(r, sourceFile));
  const byHash = new Map<string, string[]>();
  for (const m of mapped) {
    if (!m.value) continue;
    const list = byHash.get(m.value.contentHash) ?? [];
    list.push(m.value.originalId);
    byHash.set(m.value.contentHash, list);
  }
  const duplicates = [...byHash.entries()]
    .filter(([, ids]) => ids.length > 1)
    .map(([contentHash, originalIds]) => ({ contentHash, originalIds }));
  // Mark the non-first duplicates with a warning.
  const firstSeen = new Set<string>();
  for (const m of mapped) {
    if (!m.value) continue;
    if (firstSeen.has(m.value.contentHash)) {
      m.warnings.push("نسخة مكررة تماماً لسؤال آخر (بنفس النص والإجابة)");
    } else {
      firstSeen.add(m.value.contentHash);
    }
  }
  return { mapped, duplicates };
}

export function hashFileContent(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}
