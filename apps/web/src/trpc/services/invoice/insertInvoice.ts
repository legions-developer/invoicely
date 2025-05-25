import { insertInvoiceQuery } from "@/lib/db-queries/invoice/insertInvoice";
import { authorizedProcedure } from "@/trpc/procedures/authorizedProcedure";
import { createInvoiceSchema } from "@/zod-schemas/invoice/create-invoice";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "@/constants/issues";
import { parseCatchError } from "@/lib/neverthrow/parseCatchError";
import { TRPCError } from "@trpc/server";

interface MutationResponse {
  success: boolean;
  message: string;
  invoiceId?: string;
}

export const insertInvoice = authorizedProcedure
  .input(createInvoiceSchema)
  .mutation<MutationResponse>(async ({ ctx, input }) => {
    // If user didn't allow saving data in db then return error
    if (!ctx.auth.user.allowedSavingData) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: ERROR_MESSAGES.NOT_ALLOWED_TO_SAVE_DATA,
      });
    }

    try {
      const invoiceId = await insertInvoiceQuery(input, ctx.auth.user.id);

      return {
        success: true,
        message: SUCCESS_MESSAGES.INVOICE_SAVED,
        invoiceId,
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: parseCatchError(error),
      });
    }
  });
