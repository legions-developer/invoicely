import { ZodCreateInvoiceSchema } from "@/zod-schemas/invoice/create-invoice";
import { IDB_SCHEMA_INVOICES } from "@/constants/indexed-db";
import { IDBInvoice } from "@/types/indexdb/invoice";
import { initIndexedDB } from "@/global/indexdb";
import { v4 as uuidv4 } from "uuid";

/**
 * Force insert an invoice into the database
 * @param invoice - The invoice to insert
 * @returns {Promise<void>}
 * @description This function will override the existing invoice if it already exists because it contains db.put() method. using db.add() to add new record
 */
export const forceInsertInvoice = async (invoice: ZodCreateInvoiceSchema): Promise<void> => {
  const db = await initIndexedDB();
  await db.put(IDB_SCHEMA_INVOICES, {
    id: uuidv4(),
    type: "index_db",
    status: "pending",
    invoiceFields: invoice,
    createdAt: new Date(),
    updatedAt: new Date(),
    paidAt: null,
  });
};

/**
 * Get all invoices from the database
 * @returns {Promise<IDBInvoice[]>}
 */
export const getAllInvoices = async (): Promise<IDBInvoice[]> => {
  const db = await initIndexedDB();
  return await db.getAll(IDB_SCHEMA_INVOICES);
};
