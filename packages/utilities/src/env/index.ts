import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    DATABASE_URL: z.string(),
    GOOGLE_CLIENT_ID: z.string(),
    GOOGLE_CLIENT_SECRET: z.string(),
    CF_R2_ENDPOINT: z.string(),
    CF_R2_ACCESS_KEY_ID: z.string(),
    CF_R2_SECRET_ACCESS_KEY: z.string(),
    CF_R2_BUCKET_NAME: z.string(),
    CF_R2_PUBLIC_DOMAIN: z.string(),
  },
  client: {
    NEXT_PUBLIC_POSTHOG_HOST: z.string(),
    NEXT_PUBLIC_POSTHOG_KEY: z.string(),
    NEXT_PUBLIC_BASE_URL: z.string(),
    NEXT_PUBLIC_TRPC_BASE_URL: z.string(),
  },
  runtimeEnv: {
    // =========== SERVER ===========
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    CF_R2_ENDPOINT: process.env.CF_R2_ENDPOINT,
    CF_R2_ACCESS_KEY_ID: process.env.CF_R2_ACCESS_KEY_ID,
    CF_R2_SECRET_ACCESS_KEY: process.env.CF_R2_SECRET_ACCESS_KEY,
    CF_R2_BUCKET_NAME: process.env.CF_R2_BUCKET_NAME,
    CF_R2_PUBLIC_DOMAIN: process.env.CF_R2_PUBLIC_DOMAIN,
    // =========== PUBLIC ===========
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    NEXT_PUBLIC_TRPC_BASE_URL: process.env.NEXT_PUBLIC_TRPC_BASE_URL,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
