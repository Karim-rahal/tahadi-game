import type { NextFunction, Request, Response } from "express";
import type { ApiErr, ApiOk } from "@darundi/shared";

export function ok<T>(res: Response, data: T, status = 200): Response {
  const body: ApiOk<T> = { ok: true, data };
  return res.status(status).json(body);
}

export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export const badRequest = (message: string, details?: unknown) =>
  new HttpError(400, "BAD_REQUEST", message, details);
export const unauthorized = (message = "غير مصرّح") =>
  new HttpError(401, "UNAUTHORIZED", message);
export const forbidden = (message = "ممنوع") => new HttpError(403, "FORBIDDEN", message);
export const notFound = (message = "غير موجود") => new HttpError(404, "NOT_FOUND", message);
export const conflict = (message: string, details?: unknown) =>
  new HttpError(409, "CONFLICT", message, details);

export function sendError(res: Response, err: HttpError): Response {
  const body: ApiErr = {
    ok: false,
    error: { code: err.code, message: err.message, details: err.details },
  };
  return res.status(err.status).json(body);
}

/** Wrap async route handlers so thrown errors reach the error middleware. */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}
