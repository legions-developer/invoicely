import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
import postgres from "postgres";

interface DatabaseGlobal {
  invoicelySql?: ReturnType<typeof postgres>;
}

const databaseGlobal = globalThis as typeof globalThis & DatabaseGlobal;

function createSqlClient() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  return postgres(databaseUrl, {
    prepare: false,
  });
}

const sql = databaseGlobal.invoicelySql ?? createSqlClient();

if (process.env.NODE_ENV !== "production") {
  databaseGlobal.invoicelySql = sql;
}

const db = drizzle(sql, { schema });

export { db, sql, schema };
