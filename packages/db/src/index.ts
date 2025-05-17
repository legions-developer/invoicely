import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { env } from "@invoicely/utilities";
import * as schema from "./schema";

const sql = neon(env.DATABASE_URL);

const db = drizzle(sql, { schema });

export { db, sql, schema };
