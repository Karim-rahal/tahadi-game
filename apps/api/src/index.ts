import { createApp } from "./app";
import { env } from "./env";
import { logger } from "./logger";
import { prisma } from "./db";

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, "تحدي الدروندي API listening");
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
