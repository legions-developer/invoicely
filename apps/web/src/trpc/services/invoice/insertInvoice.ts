import { insertInvoiceQuery } from "@/lib/db-queries/invoice/insertInvoice";
import { authorizedProcedure } from "@/trpc/procedures/authorizedProcedure";
import { createInvoiceSchema } from "@/zod-schemas/invoice/create-invoice";
import { parseCatchError } from "@/lib/neverthrow/parseCatchError";
import { asyncTryCatch } from "@/lib/neverthrow/tryCatch";

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

    const { success, error } = await asyncTryCatch(insertInvoiceQuery(input, ctx.auth.user.id));

    if (!success) {
      return {
        success: false,
        message: parseCatchError(error),
      };
    }

    return {
      success: true,
      message: "Invoice saved successfully",
    };
  });
