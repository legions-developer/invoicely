import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { env } from "@invoicely/utilities";
import type { serverAuth } from "./auth";

export const clientAuth = createAuthClient({
  baseURL: env.NEXT_PUBLIC_BASE_URL,
  plugins: [inferAdditionalFields<typeof serverAuth>()],
});

// For faster user :3
export const { getSession, useSession } = createAuthClient();
