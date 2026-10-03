import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { env } from "@invoicely/utilities";
import type { serverAuth } from "./auth";

export const clientAuth = createAuthClient({
  // Preview deployments serve their own auth routes even when sharing production credentials.
  baseURL: typeof window === "undefined" ? env.NEXT_PUBLIC_BASE_URL : window.location.origin,
  plugins: [inferAdditionalFields<typeof serverAuth>()],
});

// For faster use :3
export const { getSession, useSession } = clientAuth;
