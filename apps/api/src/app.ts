import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { pinoHttp } from "pino-http";
import { env } from "./env";
import { logger } from "./logger";
import { HttpError, sendError } from "./lib/http";
import { errorHandler } from "./middleware/error";
import { healthRouter } from "./routes/health";
import { categoriesRouter } from "./routes/categories";
import { questionsRouter } from "./routes/questions";
import { gamesRouter } from "./routes/games";
import { importsRouter, reportsRouter } from "./routes/reports";

export function createApp() {
  const app = express();

  // Behind Railway's proxy — trust it so secure cookies / rate-limit IPs work.
  app.set("trust proxy", 1);

  app.use(helmet());
  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true,
      methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "x-judge-token", "x-admin-token"],
    }),
  );
  app.use(cookieParser());
  app.use(express.json({ limit: "256kb" }));
  app.use(pinoHttp({ logger }));

  // Global rate limit (per IP). Game actions get a tighter limiter.
  const globalLimiter = rateLimit({ windowMs: 60_000, max: 300, standardHeaders: true, legacyHeaders: false });
  const writeLimiter = rateLimit({ windowMs: 60_000, max: 120, standardHeaders: true, legacyHeaders: false });
  app.use(globalLimiter);

  app.use("/api/health", healthRouter);
  app.use("/api/categories", categoriesRouter);
  app.use("/api/questions", questionsRouter);
  app.use("/api/games", writeLimiter, gamesRouter);
  app.use("/api/reports", reportsRouter);
  app.use("/api/imports", importsRouter);

  app.use((_req, res) => {
    sendError(res, new HttpError(404, "NOT_FOUND", "المسار غير موجود"));
  });

  app.use(errorHandler);
  return app;
}
