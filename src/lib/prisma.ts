import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { env } from "@/env";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

// Use adapter pattern for Prisma 7 compatibility
const connectionString = env.DATABASE_URL;

const pool = new Pool({
    connectionString,
    ssl: connectionString?.includes("supabase.com") || env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : false
});
const adapter = new PrismaPg(pool);

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        adapter,
        // Original log config
        log:
            env.NODE_ENV === "development"
                ? ["query", "error", "warn"]
                : ["error"],
    });

if (env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}

export default prisma;
