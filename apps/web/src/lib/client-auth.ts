import { createAuthClient } from "better-auth/react";
import { env } from "@invoicely/utilities";

export const clientAuth = createAuthClient({
  baseURL: env.NEXT_PUBLIC_BASE_URL,
});

// For faster user :3
export const { getSession, useSession } = createAuthClient();
