import type { InvoiceStatusType } from "@invoicely/db/schema/invoice";
import { IDB_SCHEMA_INVOICES } from "@/constants/indexed-db";
import { initIndexedDB } from "@/global/indexdb";

export const updateInvoiceStatus = async (invoiceId: string, status: InvoiceStatusType) => {
  const db = await initIndexedDB();

  // getting invoice with current InvoiceID
  const invoice = await db.get(IDB_SCHEMA_INVOICES, invoiceId);

  if (!invoice) {
    throw new Error("Invoice not found! Please try again.");
  }

  // Checking if current invoice status is same as the new status
  if (invoice.status === status) {
    throw new Error("Try updating to a different status. Current status is same as the new status.");
  }

  // Now we will reupdate the invoice with the new status
  await db.put(IDB_SCHEMA_INVOICES, {
    ...invoice,
    status: status,
    paidAt: status === "success" ? new Date() : null,
  });
};
