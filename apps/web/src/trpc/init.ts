import type * as trpcFetch from "@trpc/server/adapters/fetch";
import { superjsonTransformer } from "./transformer";
import { initTRPC } from "@trpc/server";
import { parse } from "cookie";
import { cache } from "react";

export const createTRPCContext = cache(async ({ req }: trpcFetch.FetchCreateContextFnOptions) => {
  const cookie = req.headers.get("cookie");

  if (!cookie) {
    return {
      betterAuthSession: undefined,
    };
  }

  const cookies = parse(cookie);

  const betterAuthSession = cookies["better-auth.session_token"];

  return {
    betterAuthSession,
  };
});
// Avoid exporting the entire t-object
// since it's not very descriptive.
// For instance, the use of a t variable
// is common in i18n libraries.
const t = initTRPC.create({
  transformer: superjsonTransformer,
});
// Base router and procedure helpers
export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;

// Procedure helpers
export const baseProcedure = t.procedure;

// middleware
export const middleware = t.middleware;
