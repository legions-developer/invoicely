import { db, schema } from "@invoicely/db";
import { eq } from "drizzle-orm";

/** Fetch only the financial fields needed to summarize the current user's invoices. */
export const getDashboardInvoicesQuery = async (userId: string) => {
  return db.query.invoices.findMany({
    where: eq(schema.invoices.userId, userId),
    columns: {
      id: true,
      type: true,
      status: true,
      paidAt: true,
    },
    with: {
      invoiceFields: {
        columns: {},
        with: {
          clientDetails: {
            columns: { name: true, address: true },
          },
          invoiceDetails: {
            columns: { currency: true, date: true, dueDate: true },
            with: {
              billingDetails: {
                columns: { type: true, value: true },
              },
            },
          },
          items: {
            columns: { quantity: true, unitPrice: true },
          },
        },
      },
    },
  });
};
