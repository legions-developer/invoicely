import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { betterAuth } from "better-auth";
import { db } from "@invoicely/db";

export const serverAuth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  user: {
    additionalFields: {
      allowedSavingData: {
        type: "boolean",
        required: false,
        defaultValue: false,
        fieldName: "allowed_saving_data",
      },
    },
  },
  advanced: {
    database: {
      generateId: false,
    },
  },
});
