import { invoiceRouter } from "@/trpc/services/invoice";
import { createTRPCRouter } from "../init";

export const appRouter = createTRPCRouter({
  invoice: invoiceRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;
