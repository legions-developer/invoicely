import { createAuthClient } from "better-auth/react";
import { env } from "@invoicely/utilities";

export const clientAuth = createAuthClient({
  baseURL: env.NEXT_PUBLIC_BASE_URL,
});

export const { signIn, signUp, signOut, getSession, useSession } = createAuthClient();
