import { getDashboardInvoicesQuery } from "@/lib/db-queries/invoice/getDashboardInvoices";
import { authorizedProcedure } from "@/trpc/procedures/authorizedProcedure";
import { parseCatchError } from "@/lib/neverthrow/parseCatchError";
import { InternalServerError } from "@/lib/effect/error/trpc";
import { TRPCError } from "@trpc/server";
import { Effect } from "effect";

export const getDashboard = authorizedProcedure.query(async ({ ctx }) => {
  const dashboardEffect = Effect.gen(function* () {
    const invoices = yield* Effect.tryPromise({
      try: () => getDashboardInvoicesQuery(ctx.auth.user.id),
      catch: (error) => new InternalServerError({ message: parseCatchError(error) }),
    });

    // Decimal strings retain database precision across the API boundary.
    return invoices.map((invoice) => ({
      ...invoice,
      invoiceFields: {
        ...invoice.invoiceFields,
        items: invoice.invoiceFields.items.map((item) => ({
          ...item,
          unitPrice: item.unitPrice.toString(),
        })),
        invoiceDetails: {
          ...invoice.invoiceFields.invoiceDetails,
          billingDetails: invoice.invoiceFields.invoiceDetails.billingDetails.map((detail) => ({
            ...detail,
            value: detail.value.toString(),
          })),
        },
      },
    }));
  });

  return Effect.runPromise(
    dashboardEffect.pipe(
      Effect.catchTags({
        InternalServerError: (error) =>
          Effect.fail(new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message })),
      }),
    ),
  );
});
