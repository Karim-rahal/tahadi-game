// Entry point for the تحدي الدروندي backend (Express + Prisma).
import { execSync, exec } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createApp } from "./app";
import { env } from "./env";
import { logger } from "./logger";
import { prisma } from "./db";

// apps/api (dist/index.js -> apps/api). Prisma schema + migrations and the
// data banks live under this dir / the repo root, both present in the image.
const apiDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// Apply DB migrations BEFORE serving — the API cannot answer a single query
// without its tables. `migrate deploy` is a no-op once everything is applied,
// so this is safe to run on every boot and is independent of the build driver
// (works whether Railway builds with the Dockerfile or railpack).
try {
  logger.info("Applying database migrations…");
  execSync("npx prisma migrate deploy", { cwd: apiDir, stdio: "inherit" });
  logger.info("Database migrations up to date");
} catch (err) {
  logger.error({ err }, "prisma migrate deploy failed — cannot serve without tables");
  process.exit(1);
}

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, "تحدي الدروندي API listening");

  // Idempotent question-bank import, in the BACKGROUND (async exec, so the
  // event loop keeps serving and the health check passes immediately). Upserts
  // by (sourceFile, originalId), so re-running never duplicates records.
  exec("npm run import", { cwd: apiDir }, (err, _stdout, stderr) => {
    if (err) {
      logger.warn({ err, stderr }, "Question-bank import skipped (non-fatal)");
    } else {
      logger.info("Question-bank import complete");
    }
  });
});

async function shutdown(signal: string) {
  logger.info({ signal }, "Shutting down");
  server.close(() => {
    void prisma.$disconnect().finally(() => process.exit(0));
  });
  // Force-exit if close hangs.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
