import { authorizedProcedure } from "@/trpc/procedures/authorizedProcedure";
import { listInvoicesQuery } from "@/lib/db-queries/invoice/listInvoices";
import { parseCatchError } from "@/lib/neverthrow/parseCatchError";
import { TRPCError } from "@trpc/server";

export const listInvoices = authorizedProcedure.query(async ({ ctx }) => {
  try {
    const invoices = await listInvoicesQuery(ctx.auth.user.id);

    return invoices;
  } catch (e) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Error fetching invoices",
      cause: parseCatchError(e),
    });
  }
});
