import { db, schema } from "@invoicely/db";
import { and, eq } from "drizzle-orm";

/**
 * Get an invoice by id and user id
 * @param id - The ID of the invoice to get
 * @param userId - The ID of the user to get the invoice for
 * @returns The invoice
 */
export const getInvoiceQuery = async (id: string, userId: string) => {
  const invoice = await db.query.invoices.findFirst({
    where: and(eq(schema.invoices.id, id), eq(schema.invoices.userId, userId)),
    with: {
      invoiceFields: {
        with: {
          clientDetails: {
            with: {
              metadata: true,
            },
          },
          companyDetails: {
            with: {
              metadata: true,
            },
          },
          invoiceDetails: {
            with: {
              billingDetails: true,
            },
          },
          metadata: {
            with: {
              paymentInformation: true,
            },
          },
          items: true,
        },
      },
    },
  });

  return invoice;
};
