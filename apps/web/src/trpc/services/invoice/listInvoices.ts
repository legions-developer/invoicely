import { authorizedProcedure } from "@/trpc/procedures/authorizedProcedure";
import { listInvoicesQuery } from "@/lib/db-queries/invoice/listInvoices";
import { parseCatchError } from "@/lib/neverthrow/parseCatchError";
import { TRPCError } from "@trpc/server";

export const listInvoices = authorizedProcedure.query(async ({ ctx }) => {
  try {
    const invoices = await listInvoicesQuery(ctx.auth.user.id);

    return invoices.map((invoice) => ({
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
    }));
  } catch (error) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: parseCatchError(error),
    });
  }
});
