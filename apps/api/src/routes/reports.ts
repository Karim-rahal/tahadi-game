import { Router } from "express";
import { reportQuestionSchema } from "@darundi/shared";
import { prisma } from "../db";
import { asyncHandler, notFound, ok } from "../lib/http";
import { requireAdmin } from "../middleware/session";

export const reportsRouter = Router();

/** Anyone (the judge) may report a questionable question during play. */
reportsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const body = reportQuestionSchema.parse(req.body);
    const question = await prisma.question.findUnique({ where: { id: body.questionId } });
    if (!question) throw notFound("السؤال غير موجود");
    const report = await prisma.questionReport.create({
      data: { questionId: body.questionId, gameId: body.gameId, reason: body.reason },
    });
    ok(res, report, 201);
  }),
);

/** Admin-only: list reports. */
reportsRouter.get(
  "/",
  requireAdmin,
  asyncHandler(async (_req, res) => {
    const reports = await prisma.questionReport.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { question: { select: { questionText: true, sourceFile: true, originalId: true } } },
    });
    ok(res, reports);
  }),
);

/** Import batch reports (admin). */
export const importsRouter = Router();
importsRouter.get(
  "/",
  requireAdmin,
  asyncHandler(async (_req, res) => {
    const batches = await prisma.importBatch.findMany({ orderBy: { startedAt: "desc" } });
    ok(res, batches);
  }),
);
