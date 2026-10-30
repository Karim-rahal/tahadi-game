import path from "node:path";
import { fileURLToPath } from "node:url";
import { prisma } from "../db";
import { logger } from "../logger";
import { importFile } from "../services/runImport";

/**
 * Idempotent import/seed. Re-running does NOT duplicate records (upsert by
 * sourceFile + originalId). Writes a machine-readable report per file into
 * <repo>/docs. Usage:
 *   npm run import              # import both categories
 *   npm run import -- --dry-run # analyze only, no DB writes
 */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// apps/api/src/scripts -> repo root
const repoRoot = path.resolve(__dirname, "../../../..");
const dataDir = path.join(repoRoot, "data");
const docsDir = path.join(repoRoot, "docs");

const dryRun = process.argv.includes("--dry-run");

async function main() {
  const results = [];
  results.push(
    await importFile({
      filePath: path.join(dataDir, "religious", "religious_questions_600_draft.json"),
      sourceFile: "religious",
      categorySlug: "religious",
      categoryNameAr: "أسئلة دينية",
      reportDir: docsDir,
      dryRun,
    }),
  );
  results.push(
    await importFile({
      filePath: path.join(dataDir, "geography", "geography_600_playtest.json"),
      sourceFile: "geography",
      categorySlug: "geography",
      categoryNameAr: "بلاد العالم والجغرافيا",
      reportDir: docsDir,
      dryRun,
    }),
  );
  results.push(
    await importFile({
      filePath: path.join(dataDir, "mathematics", "fast_mathematics_600.json"),
      sourceFile: "mathematics",
      categorySlug: "mathematics",
      categoryNameAr: "الحساب السريع",
      reportDir: docsDir,
      dryRun,
    }),
  );

  for (const r of results) {
    logger.info(
      {
        file: r.sourceFile,
        read: r.totalRead,
        inserted: r.inserted,
        updated: r.updated,
        skipped: r.skipped,
        duplicates: r.duplicateContentHashes.length,
        byType: r.byType,
      },
      "Summary",
    );
  }
}

main()
  .catch((err) => {
    logger.error({ err }, "Import failed");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
