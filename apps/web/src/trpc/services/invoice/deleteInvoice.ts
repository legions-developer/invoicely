import { deleteInvoiceQuery } from "@/lib/db-queries/invoice/deleteInvoice";
import { authorizedProcedure } from "@/trpc/procedures/authorizedProcedure";
import { parseCatchError } from "@/lib/neverthrow/parseCatchError";
import { SUCCESS_MESSAGES } from "@/constants/issues";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

const deleteInvoiceSchema = z.object({
  id: z.string(),
});

interface MutationResponse {
  success: boolean;
  message: string;
}

export const deleteInvoice = authorizedProcedure
  .input(deleteInvoiceSchema)
  .mutation<MutationResponse>(async ({ ctx, input }) => {
    try {
      await deleteInvoiceQuery(input.id, ctx.auth.user.id);

      return {
        success: true,
        message: SUCCESS_MESSAGES.INVOICE_DELETED,
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: parseCatchError(error),
      });
    }
  });
