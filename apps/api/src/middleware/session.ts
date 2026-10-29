import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { prisma } from "../db";
import { env, isProd } from "../env";
import { asyncHandler, forbidden, notFound, unauthorized } from "../lib/http";

export const SESSION_COOKIE = "darundi_session";

/** Generate a high-entropy, unguessable capability token. */
export function generateToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

/** Store only a keyed hash of the token (HMAC with SESSION_SECRET). */
export function hashToken(token: string): string {
  return crypto.createHmac("sha256", env.SESSION_SECRET).update(token).digest("hex");
}

/** Constant-time compare to avoid timing leaks. */
export function tokensMatch(token: string, storedHash: string): boolean {
  const a = Buffer.from(hashToken(token));
  const b = Buffer.from(storedHash);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function setSessionCookie(res: Response, token: string): void {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    // Cross-site (different Railway subdomains) needs None+Secure in prod.
    sameSite: isProd ? "none" : "lax",
    path: "/",
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE, { path: "/" });
}

function tokenFromRequest(req: Request): string | null {
  const cookieToken = (req.cookies?.[SESSION_COOKIE] as string | undefined) ?? null;
  if (cookieToken) return cookieToken;
  // Fallback for clients where third-party cookies are blocked.
  const header = req.header("x-judge-token");
  return header ? header.trim() : null;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      gameId?: string;
    }
  }
}

/**
 * Guards a game-scoped route. The game id comes from the URL; authorization is
 * proven ONLY by holding the capability token (never by knowing the game id).
 */
export const requireJudge = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const gameId = req.params.id;
  if (!gameId) throw notFound("معرّف اللعبة مفقود");
  const game = await prisma.gameSession.findUnique({ where: { id: gameId } });
  if (!game) throw notFound("اللعبة غير موجودة");
  const token = tokenFromRequest(req);
  if (!token) throw unauthorized("يلزم رمز الجلسة");
  if (!tokensMatch(token, game.tokenHash)) throw forbidden("لا تملك صلاحية هذه اللعبة");
  req.gameId = gameId;
  next();
});

/** Admin guard for question-bank mutations (edit/disable). */
export const requireAdmin = (req: Request, _res: Response, next: NextFunction) => {
  if (!env.ADMIN_TOKEN) throw forbidden("إدارة الأسئلة غير مُفعّلة على هذا الخادم");
  const provided = req.header("x-admin-token");
  if (!provided || provided !== env.ADMIN_TOKEN) throw unauthorized("رمز الإدارة غير صحيح");
  next();
};
