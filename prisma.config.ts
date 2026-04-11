import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url:
      process.env.DATABASE_URL ||
      "postgresql://postgres:gigi1234@localhost:5432/sikeu_rt?schema=public",
  },
});
