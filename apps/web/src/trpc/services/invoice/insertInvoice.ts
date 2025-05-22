import { insertInvoiceQuery } from "@/lib/db-queries/invoice/insertInvoice";
import { authorizedProcedure } from "@/trpc/procedures/authorizedProcedure";
import { createInvoiceSchema } from "@/zod-schemas/invoice/create-invoice";
import { parseCatchError } from "@/lib/neverthrow/parseCatchError";
import { TRPCError } from "@trpc/server";

interface MutationResponse {
  success: boolean;
  message: string;
}

export const insertInvoice = authorizedProcedure
  .input(createInvoiceSchema)
  .mutation<MutationResponse>(async ({ ctx, input }) => {
    // If user didn't allow saving data in db then return error
    if (!ctx.auth.user.allowedSavingData) {
      return {
        success: false,
        message: "User has not enabled data saving in their preferences",
      };
    }
    try {
      await insertInvoiceQuery(input, ctx.auth.user.id);

      return {
        success: true,
        message: "Invoice saved successfully",
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to insert invoice",
        cause: parseCatchError(error),
      });
    }
  });
