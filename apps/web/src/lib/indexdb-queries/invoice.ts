import { IDB_SCHEMA_INVOICES } from "@/constants/indexed-db";
import { IDBInvoice } from "@/types/indexdb/invoice";
import { initIndexedDB } from "@/global/indexdb";

/**
 * Force insert an invoice into the database
 * @param invoice - The invoice to insert
 * @returns {Promise<void>}
 * @description This function will override the existing invoice if it already exists because it contains db.put() method. using db.add() to add new record
 */
export const forceInsertInvoice = async (invoice: IDBInvoice): Promise<void> => {
  const db = await initIndexedDB();
  await db.put(IDB_SCHEMA_INVOICES, invoice);
};

/**
 * Get all invoices from the database
 * @returns {Promise<IDBInvoice[]>}
 */
export const getAllInvoices = async (): Promise<IDBInvoice[]> => {
  const db = await initIndexedDB();
  return await db.getAll(IDB_SCHEMA_INVOICES);
};
