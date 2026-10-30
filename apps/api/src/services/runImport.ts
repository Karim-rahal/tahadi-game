import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { normalizeArabic } from "@darundi/shared";
import { prisma } from "../db";
import { logger } from "../logger";
import {
  type ImportReport,
  type ImportReportRecord,
  type SourceFile,
  analyzeRecords,
  hashFileContent,
} from "./importer";

export interface ImportFileOptions {
  filePath: string;
  sourceFile: SourceFile;
  categorySlug: string;
  categoryNameAr: string;
  /** Where to write the machine-readable report (optional). */
  reportDir?: string;
  /** If true, only analyze and report without writing to the DB. */
  dryRun?: boolean;
}

export async function importFile(opts: ImportFileOptions): Promise<ImportReport> {
  const content = await readFile(opts.filePath, "utf-8");
  const fileHash = hashFileContent(content);
  const parsed = JSON.parse(content) as { questions?: unknown[] };
  const rawQuestions = Array.isArray(parsed.questions) ? (parsed.questions as Record<string, unknown>[]) : [];

  const { mapped, duplicates } = analyzeRecords(rawQuestions, opts.sourceFile);

  const report: ImportReport = {
    sourceFile: opts.sourceFile,
    fileHash,
    totalRead: rawQuestions.length,
    inserted: 0,
    updated: 0,
    skipped: 0,
    byType: {},
    byDifficulty: {},
    duplicateContentHashes: duplicates,
    records: [],
    warnings: [],
  };

  if (opts.dryRun) {
    for (const m of mapped) {
      const rec: ImportReportRecord = {
        originalId: m.originalId,
        status: m.value ? "inserted" : "skipped",
        errors: m.errors,
        warnings: m.warnings,
      };
      if (!m.value) report.skipped++;
      report.records.push(rec);
    }
    await maybeWriteReport(report, opts);
    return report;
  }

  const category = await prisma.category.upsert({
    where: { slug: opts.categorySlug },
    create: { slug: opts.categorySlug, nameAr: opts.categoryNameAr, active: true },
    update: { nameAr: opts.categoryNameAr },
  });

  const batch = await prisma.importBatch.create({
    data: { sourceFile: opts.sourceFile, fileHash },
  });

  for (const m of mapped) {
    if (!m.value) {
      report.skipped++;
      report.records.push({
        originalId: m.originalId,
        status: "skipped",
        errors: m.errors,
        warnings: m.warnings,
      });
      continue;
    }
    const v = m.value;

    const existing = await prisma.question.findUnique({
      where: { sourceFile_originalId: { sourceFile: opts.sourceFile, originalId: v.originalId } },
      select: { id: true },
    });

    const data = {
      categoryId: category.id,
      type: v.type,
      difficulty: v.difficulty,
      questionText: v.questionText,
      answerText: v.answerText,
      explanation: v.explanation,
      isTrue: v.isTrue,
      minimumRequired: v.minimumRequired,
      topic: v.topic,
      sect: v.sect,
      sourceReference: v.sourceReference,
      sourceUrl: v.sourceUrl,
      sourceVerified: v.sourceVerified,
      reviewStatus: v.reviewStatus,
      reviewNotes: v.reviewNotes,
      flaggedForReview: v.flaggedForReview,
      acceptedAnswersIncomplete: v.acceptedAnswersIncomplete,
      contentHash: v.contentHash,
      rawMetadata: v.rawMetadata as object,
      importBatchId: batch.id,
    };

    const question = await prisma.question.upsert({
      where: { sourceFile_originalId: { sourceFile: opts.sourceFile, originalId: v.originalId } },
      create: { sourceFile: opts.sourceFile, originalId: v.originalId, ...data },
      update: data,
    });

    // Upsert clues by (questionId, order).
    for (let i = 0; i < v.clues.length; i++) {
      await prisma.questionClue.upsert({
        where: { questionId_order: { questionId: question.id, order: i } },
        create: { questionId: question.id, order: i, text: v.clues[i]! },
        update: { text: v.clues[i]! },
      });
    }
    // Prune stale clues left over when a re-import shrinks a question's clue list.
    await prisma.questionClue.deleteMany({ where: { questionId: question.id, order: { gte: v.clues.length } } });
    // Upsert accepted-answer GROUPS by (questionId, order): one row per group,
    // with its canonical text + alias spellings. Aliases are never separate rows.
    for (let i = 0; i < v.answerGroups.length; i++) {
      const g = v.answerGroups[i]!;
      await prisma.acceptedAnswer.upsert({
        where: { questionId_order: { questionId: question.id, order: i } },
        create: { questionId: question.id, order: i, text: g.canonical, aliases: g.aliases, normalized: normalizeArabic(g.canonical) },
        update: { text: g.canonical, aliases: g.aliases, normalized: normalizeArabic(g.canonical) },
      });
    }
    // Prune stale answer rows from a shrunk re-import — but only those never
    // used in a game (a referenced row would break the foreign key).
    await prisma.acceptedAnswer.deleteMany({
      where: { questionId: question.id, order: { gte: v.answerGroups.length }, usages: { none: {} } },
    });

    const status = existing ? "updated" : "inserted";
    if (existing) report.updated++;
    else report.inserted++;
    report.byType[v.type] = (report.byType[v.type] ?? 0) + 1;
    report.byDifficulty[v.difficulty] = (report.byDifficulty[v.difficulty] ?? 0) + 1;
    report.records.push({ originalId: v.originalId, status, errors: m.errors, warnings: m.warnings });
  }

  await prisma.importBatch.update({
    where: { id: batch.id },
    data: {
      finishedAt: new Date(),
      totalRead: report.totalRead,
      inserted: report.inserted,
      updated: report.updated,
      skipped: report.skipped,
      warnings: report.records.flatMap((r) => r.warnings).slice(0, 500),
      report: {
        byType: report.byType,
        byDifficulty: report.byDifficulty,
        duplicateCount: report.duplicateContentHashes.length,
      },
    },
  });

  await maybeWriteReport(report, opts);
  logger.info(
    { sourceFile: opts.sourceFile, inserted: report.inserted, updated: report.updated, skipped: report.skipped },
    "Import finished",
  );
  return report;
}

async function maybeWriteReport(report: ImportReport, opts: ImportFileOptions): Promise<void> {
  if (!opts.reportDir) return;
  await mkdir(opts.reportDir, { recursive: true });
  const out = path.join(opts.reportDir, `import-report.${opts.sourceFile}.json`);
  await writeFile(out, JSON.stringify(report, null, 2), "utf-8");
  logger.info({ out }, "Wrote import report");
}
