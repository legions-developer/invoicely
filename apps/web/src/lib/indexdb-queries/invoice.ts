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
export const forceInsertInvoice = async (invoice: ZodCreateInvoiceSchema): Promise<string> => {
  const db = await initIndexedDB();

  const id = uuidv4();

  await db.put(IDB_SCHEMA_INVOICES, {
    id: id,
    type: "local",
    status: "pending",
    invoiceFields: invoice,
    createdAt: new Date(),
    updatedAt: new Date(),
    paidAt: null,
  });

  return id;
};

/**
 * Get all invoices from the database
 * @returns {Promise<IDBInvoice[]>}
 */
export const getAllInvoices = async (): Promise<IDBInvoice[]> => {
  const db = await initIndexedDB();
  return await db.getAll(IDB_SCHEMA_INVOICES);
};

/**
 * Get an invoice from the database by id
 * @param id - The id of the invoice
 * @returns {Promise<IDBInvoice>}
 */
export const getInvoiceById = async (id: string): Promise<IDBInvoice | undefined> => {
  const db = await initIndexedDB();
  return await db.get(IDB_SCHEMA_INVOICES, id);
};

/**
 * Update an invoice in the database
 * @param id - The id of the invoice
 * @param invoice - The invoice to update
 * @returns {Promise<void>}
 */
export const updateInvoice = async (id: string, invoice: ZodCreateInvoiceSchema): Promise<void> => {
  const db = await initIndexedDB();

  const oldInvoice = await db.get(IDB_SCHEMA_INVOICES, id);

  if (!oldInvoice) {
    throw new Error("Invoice not found! Please try again.");
  }

  // first we delete the old invoice with the id
  await db.delete(IDB_SCHEMA_INVOICES, id);

  // then we add the new invoice
  await db.put(IDB_SCHEMA_INVOICES, {
    ...oldInvoice,
    id: oldInvoice.id,
    updatedAt: new Date(),
    invoiceFields: invoice,
  });
};
