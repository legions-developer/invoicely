import { getFileSizeFromBase64 } from "@/lib/invoice/get-file-size-from-base64";
import { deleteInvoiceQuery } from "@/lib/db-queries/invoice/deleteInvoice";
import { insertInvoiceQuery } from "@/lib/db-queries/invoice/insertInvoice";
import { authorizedProcedure } from "@/trpc/procedures/authorizedProcedure";
import { createInvoiceSchema } from "@/zod-schemas/invoice/create-invoice";
import { getInvoiceQuery } from "@/lib/db-queries/invoice/getInvoice";
import { parseCatchError } from "@/lib/neverthrow/parseCatchError";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

const EditInvoiceSchema = z.object({
  id: z.string(),
  invoice: createInvoiceSchema,
});

export const editInvoice = authorizedProcedure.input(EditInvoiceSchema).mutation(async ({ input, ctx }) => {
  const { id, invoice } = input;

  //   if signature or logo is too large then return error ~ 250kb
  if (getFileSizeFromBase64(invoice.companyDetails.signatureBase64) > 250000) {
    return {
      success: false,
      message: "Signature is too large",
    };
  }

  if (getFileSizeFromBase64(invoice.companyDetails.logoBase64) > 250000) {
    return {
      success: false,
      message: "Logo is too large",
    };
  }

  try {
    const oldInvoice = await getInvoiceQuery(id, ctx.auth.user.id);

    if (!oldInvoice) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Invoice not found" });
    }

    //   now as we found old invoice , we will delete it from the database ( yea im pro :3)
    await deleteInvoiceQuery(id, ctx.auth.user.id);

    //   now we will insert the new invoice with same id
    await insertInvoiceQuery(invoice, ctx.auth.user.id, oldInvoice.id);

    return {
      success: true,
      message: "Invoice edited successfully",
    };
  } catch (error) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to edit invoice",
      cause: parseCatchError(error),
    });
  }
});
