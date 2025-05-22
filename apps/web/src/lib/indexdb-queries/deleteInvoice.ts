import { IDB_SCHEMA_INVOICES } from "@/constants/indexed-db";
import { initIndexedDB } from "@/global/indexdb";

/**
 * Delete an invoice from the IndexedDB
 * @param invoiceId - The ID of the invoice to delete
 * @returns {Promise<void>}
 */
export const deleteInvoiceFromIDB = async (invoiceId: string): Promise<void> => {
  const db = await initIndexedDB();
  await db.delete(IDB_SCHEMA_INVOICES, invoiceId);
};
