import { authorizedProcedure } from "@/trpc/procedures/authorizedProcedure";
import { listInvoicesQuery } from "@/lib/db-queries/invoice/listInvoices";
import { parseCatchError } from "@/lib/neverthrow/parseCatchError";
import { asyncTryCatch } from "@/lib/neverthrow/tryCatch";

export const listInvoices = authorizedProcedure.query(async ({ ctx }) => {
  const { success, data, error } = await asyncTryCatch(listInvoicesQuery(ctx.auth.user.id));

  if (!success) {
    return {
      success: false,
      message: parseCatchError(error),
    };
  }

  return {
    success: true,
    data: data.map((invoice) => ({
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
    })),
  };
});
