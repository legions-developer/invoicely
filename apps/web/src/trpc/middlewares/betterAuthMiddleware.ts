import { TRPCError } from "@trpc/server";
import { middleware } from "@/trpc/init";
import { serverAuth } from "@/lib/auth";
import { headers } from "next/headers";

export const betterAuthMiddleware = middleware(async function isAuthorized(options) {
  // Getting Betterauth Session
  const betterAuthSession = await serverAuth.api.getSession({
    headers: await headers(),
  });

  if (!betterAuthSession) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource",
    });
  }

  return options.next({
    ctx: {
      auth: betterAuthSession,
    },
  });
});
