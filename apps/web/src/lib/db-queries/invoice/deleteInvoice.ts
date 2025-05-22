import { db, schema } from "@invoicely/db";
import { and, eq } from "drizzle-orm";

/**
 * Delete an invoice for a user
 * @param invoiceId - The ID of the invoice to delete
 * @param userId - The ID of the user who owns the invoice
 * @returns The ID of the deleted invoice
 * @throws Error if the invoice is not found or failed to delete
 */
export const deleteInvoiceQuery = async (invoiceId: string, userId: string) => {
  // First, verify the invoice exists and belongs to the user
  const invoice = await db.query.invoices.findFirst({
    where: and(eq(schema.invoices.id, invoiceId), eq(schema.invoices.userId, userId)),
    columns: {
      id: true,
    },
  });

  if (!invoice) {
    throw new Error("Invoice not found or user does not have permission to delete it.");
  }

  // Due to foreign key constraints, we might need to delete related records first.
  // Assuming direct deletion is allowed or handled by cascade settings in the DB.
  // If not, specific deletions for related tables (invoiceFields, etc.) would be needed here.

  const [deletedInvoice] = await db
    .delete(schema.invoices)
    .where(and(eq(schema.invoices.id, invoiceId), eq(schema.invoices.userId, userId)))
    .returning({
      id: schema.invoices.id,
    });

  if (!deletedInvoice) {
    throw new Error("Failed to delete invoice from database.");
  }

  return deletedInvoice;
};
