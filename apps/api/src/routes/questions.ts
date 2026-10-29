import { Router } from "express";
import type { Prisma } from "@prisma/client";
import { questionQuerySchema } from "@darundi/shared";
import { prisma } from "../db";
import { asyncHandler, notFound, ok } from "../lib/http";
import { requireAdmin } from "../middleware/session";
import { z } from "zod";

export const questionsRouter = Router();

/** Judge/admin review browser. Lists the master bank with filters + search. */
questionsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const q = questionQuerySchema.parse(req.query);
    const where: Prisma.QuestionWhereInput = {
      ...(q.categoryId ? { categoryId: q.categoryId } : {}),
      ...(q.type ? { type: q.type } : {}),
      ...(q.difficulty ? { difficulty: q.difficulty } : {}),
      ...(q.reviewFlagged !== undefined ? { flaggedForReview: q.reviewFlagged } : {}),
      ...(q.disabled !== undefined ? { disabled: q.disabled } : {}),
      ...(q.search ? { questionText: { contains: q.search, mode: "insensitive" } } : {}),
    };
    const [total, items] = await Promise.all([
      prisma.question.count({ where }),
      prisma.question.findMany({
        where,
        orderBy: [{ sourceFile: "asc" }, { originalId: "asc" }],
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        include: {
          category: { select: { nameAr: true, slug: true } },
          clues: { orderBy: { order: "asc" } },
          acceptedAnswers: { orderBy: { order: "asc" } },
          _count: { select: { reports: true } },
        },
      }),
    ]);
    ok(res, { total, page: q.page, pageSize: q.pageSize, items });
  }),
);

questionsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const q = await prisma.question.findUnique({
      where: { id: req.params.id! },
      include: {
        category: true,
        clues: { orderBy: { order: "asc" } },
        acceptedAnswers: { orderBy: { order: "asc" } },
        reports: { orderBy: { createdAt: "desc" } },
      },
    });
    if (!q) throw notFound("السؤال غير موجود");
    ok(res, q);
  }),
);

const patchSchema = z.object({
  disabled: z.boolean().optional(),
  flaggedForReview: z.boolean().optional(),
});

/** Admin-only: disable a question or clear/set its review flag. */
questionsRouter.patch(
  "/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const body = patchSchema.parse(req.body);
    const q = await prisma.question.update({ where: { id: req.params.id! }, data: body });
    ok(res, q);
  }),
);
