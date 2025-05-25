import type { InvoiceStatusType } from "@invoicely/db/schema/invoice";
import { IDB_SCHEMA_INVOICES } from "@/constants/indexed-db";
import { ERROR_MESSAGES } from "@/constants/issues";
import { initIndexedDB } from "@/global/indexdb";

export const updateInvoiceStatus = async (invoiceId: string, status: InvoiceStatusType) => {
  const db = await initIndexedDB();

  // getting invoice with current InvoiceID
  const invoice = await db.get(IDB_SCHEMA_INVOICES, invoiceId);

  if (!invoice) {
    throw new Error(ERROR_MESSAGES.INVOICE_NOT_FOUND);
  }

  // Checking if current invoice status is same as the new status
  if (invoice.status === status) {
    throw new Error(ERROR_MESSAGES.TRY_UPDATING_TO_DIFFERENT_STATUS);
  }

  // Now we will reupdate the invoice with the new status
  await db.put(IDB_SCHEMA_INVOICES, {
    ...invoice,
    status: status,
    paidAt: status === "success" ? new Date() : null,
  });
};
