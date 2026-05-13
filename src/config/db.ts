import { PrismaClient } from "@prisma/client";
import { env } from "./env.js";

let prismaInstance: PrismaClient | null = null;

export function getPrisma(): PrismaClient | null {
  if (!env.DATABASE_URL) {
    return null;
  }

  prismaInstance ??= new PrismaClient();
  return prismaInstance;
}
