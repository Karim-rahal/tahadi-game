import { pino } from "pino";
import { isProd } from "./env";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isProd ? "info" : "debug"),
  // Pretty transport is intentionally omitted to avoid a hard dep in prod;
  // Railway captures structured JSON logs natively.
  redact: {
    paths: ["req.headers.cookie", "req.headers.authorization", "res.headers['set-cookie']"],
    remove: true,
  },
});
