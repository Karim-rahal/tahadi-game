import { PrismaClient } from "@prisma/client";
import { isProd } from "./env";

// Single Prisma instance (hot-reload safe in dev).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isProd ? ["warn", "error"] : ["warn", "error"],
  });

if (!isProd) globalForPrisma.prisma = prisma;
