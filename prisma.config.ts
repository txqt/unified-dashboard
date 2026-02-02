// Unified Dashboard - Prisma Configuration (v7+)
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Pooled connection for queries
    url: process.env["DATABASE_URL"],
  },
});
