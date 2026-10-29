import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { HttpError, sendError } from "../lib/http";
import { logger } from "../logger";

/** Central error handler. Converts Zod + known errors into the API envelope. */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    return sendError(res, err);
  }
  if (err instanceof ZodError) {
    return sendError(
      res,
      new HttpError(400, "VALIDATION_ERROR", "بيانات غير صالحة", err.flatten()),
    );
  }
  // Prisma known errors we care about (unique constraint, not found).
  const code = (err as { code?: string })?.code;
  if (code === "P2002") {
    return sendError(res, new HttpError(409, "CONFLICT", "تعارض في البيانات"));
  }
  if (code === "P2025") {
    return sendError(res, new HttpError(404, "NOT_FOUND", "السجل غير موجود"));
  }
  logger.error({ err }, "Unhandled error");
  return sendError(res, new HttpError(500, "INTERNAL", "خطأ داخلي في الخادم"));
};
