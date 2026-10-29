import { Router } from "express";
import { prisma } from "../db";
import { asyncHandler, ok } from "../lib/http";

export const healthRouter = Router();

healthRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    // Shallow check; DB check is separate so the LB health probe stays fast.
    ok(res, { status: "ok", time: new Date().toISOString() });
  }),
);

healthRouter.get(
  "/db",
  asyncHandler(async (_req, res) => {
    await prisma.$queryRaw`SELECT 1`;
    ok(res, { status: "ok", db: "up" });
  }),
);
