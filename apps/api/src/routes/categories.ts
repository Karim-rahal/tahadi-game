import { Router } from "express";
import type { CategoryDto } from "@darundi/shared";
import { prisma } from "../db";
import { asyncHandler, ok } from "../lib/http";

export const categoriesRouter = Router();

categoriesRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const cats = await prisma.category.findMany({
      orderBy: { nameAr: "asc" },
      include: { _count: { select: { questions: { where: { disabled: false } } } } },
    });
    const data: CategoryDto[] = cats.map((c) => ({
      id: c.id,
      nameAr: c.nameAr,
      slug: c.slug,
      questionCount: c._count.questions,
      active: c.active,
    }));
    ok(res, data);
  }),
);
