import type * as trpcFetch from "@trpc/server/adapters/fetch";
import { superjsonTransformer } from "./transformer";
import { initTRPC } from "@trpc/server";
import { cache } from "react";

// Add any context you need here ~ Legion
export const createTRPCContext = cache(async ({}: trpcFetch.FetchCreateContextFnOptions) => {
  return {};
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
