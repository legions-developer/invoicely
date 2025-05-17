import { type Config } from "drizzle-kit";
import "dotenv/config";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

export default {
  schema: "./packages/db/src/schema/index.ts",
  dialect: "postgresql",
  out: "./packages/db/migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
} satisfies Config;
