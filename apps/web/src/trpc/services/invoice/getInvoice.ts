import { authorizedProcedure } from "@/trpc/procedures/authorizedProcedure";
import { getInvoiceQuery } from "@/lib/db-queries/invoice/getInvoice";
import { parseCatchError } from "@/lib/neverthrow/parseCatchError";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

const getInvoiceSchema = z.object({
  id: z.string(),
});

export const getInvoice = authorizedProcedure.input(getInvoiceSchema).query(async ({ input, ctx }) => {
  try {
    const invoice = await getInvoiceQuery(input.id, ctx.auth.user.id);

    if (!invoice) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Invoice not found",
      });
    }

    return {
      ...invoice,
      invoiceFields: {
        ...invoice.invoiceFields,
        items: invoice.invoiceFields.items.map((item) => ({
          ...item,
          unitPrice: item.unitPrice.toNumber(),
        })),
        invoiceDetails: {
          ...invoice.invoiceFields.invoiceDetails,
          billingDetails: invoice.invoiceFields.invoiceDetails.billingDetails.map((billingDetail) => ({
            ...billingDetail,
            value: billingDetail.value.toNumber(),
          })),
        },
      },
    };
  } catch (error) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: parseCatchError(error),
    });
  }
});
