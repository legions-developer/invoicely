import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { oAuthProxy } from "better-auth/plugins/oauth-proxy";
import { env } from "@invoicely/utilities";
import { betterAuth } from "better-auth";
import { db } from "@invoicely/db";

const isCloudflarePreview = process.env.CLOUDFLARE_PREVIEW === "true";
const cloudflarePreviewHost = "*-invoicely-web.lucky-fire-9341.workers.dev";

export const serverAuth = betterAuth({
  ...(isCloudflarePreview && {
    // Sessions and API routes stay on this Worker's own preview hostname.
    baseURL: {
      allowedHosts: [cloudflarePreviewHost],
      protocol: "https" as const,
    },
  }),
  // Keep the resolved primary origin trusted as well as this Worker's previews.
  trustedOrigins: () => [`https://${cloudflarePreviewHost}`],
  plugins: [
    oAuthProxy({
      // Google uses the existing registered callback; the preview creates its own session.
      // Production and trusted previews share BETTER_AUTH_SECRET for encrypted proxy payloads.
      productionURL: process.env.BETTER_AUTH_URL,
    }),
  ],
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },
  user: {
    modelName: "users",
    additionalFields: {
      allowedSavingData: {
        type: "boolean",
        required: false,
        defaultValue: false,
        fieldName: "allowedSavingData",
        returned: true,
      },
    },
  },
  account: {
    modelName: "accounts",
  },
  session: {
    modelName: "sessions",
  },
  verification: {
    modelName: "verifications",
  },
  advanced: {
    // Better Auth 1.6 defaults to trusting forwarded headers for dynamic base URLs.
    ...(isCloudflarePreview && { trustedProxyHeaders: false }),
    database: {
      generateId: false,
    },
    ipAddress: {
      ipAddressHeaders: ["cf-connecting-ip"],
    },
  },
});
