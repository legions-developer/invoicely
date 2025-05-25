import { deleteInvoiceQuery } from "@/lib/db-queries/invoice/deleteInvoice";
import { insertInvoiceQuery } from "@/lib/db-queries/invoice/insertInvoice";
import { authorizedProcedure } from "@/trpc/procedures/authorizedProcedure";
import { createInvoiceSchema } from "@/zod-schemas/invoice/create-invoice";
import { getInvoiceQuery } from "@/lib/db-queries/invoice/getInvoice";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "@/constants/issues";
import { parseCatchError } from "@/lib/neverthrow/parseCatchError";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

const EditInvoiceSchema = z.object({
  id: z.string(),
  invoice: createInvoiceSchema,
});

export const editInvoice = authorizedProcedure.input(EditInvoiceSchema).mutation(async ({ input, ctx }) => {
  const { id, invoice } = input;

  try {
    const oldInvoice = await getInvoiceQuery(id, ctx.auth.user.id);

    if (!oldInvoice) {
      throw new TRPCError({ code: "NOT_FOUND", message: ERROR_MESSAGES.INVOICE_NOT_FOUND });
    }

    //   now as we found old invoice , we will delete it from the database ( yea im pro :3)
    await deleteInvoiceQuery(id, ctx.auth.user.id);

    //   now we will insert the new invoice with same id
    await insertInvoiceQuery(invoice, ctx.auth.user.id, oldInvoice.id);

    return {
      success: true,
      message: SUCCESS_MESSAGES.INVOICE_EDITED,
    };
  } catch (error) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: parseCatchError(error),
    });
  }
});
