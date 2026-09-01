import { createInvoiceSchemaDefaultValues } from "@/zod-schemas/invoice/create-invoice";
import { incrementSerialNumber } from "@invoicely/invoice-core";

interface InvoiceSerialSource {
  createdAt: Date;
  invoiceFields: {
    invoiceDetails: {
      prefix: string;
      serialNumber: string;
    };
  };
}

export interface NextInvoiceNumber {
  prefix: string;
  serialNumber: string;
}

/**
 * Derive the invoice number for a new invoice from the most recently created
 * invoice across both local (IndexedDB) and server (Postgres) stores, so the
 * sequence continues from wherever the user last left off regardless of where
 * the previous invoice was saved. Falls back to the schema defaults when the
 * user has no invoices yet.
 */
export const getNextInvoiceNumber = (invoices: InvoiceSerialSource[]): NextInvoiceNumber => {
  const defaults = createInvoiceSchemaDefaultValues.invoiceDetails;

  if (invoices.length === 0) {
    return { prefix: defaults.prefix, serialNumber: defaults.serialNumber };
  }

  const latest = invoices.reduce((latestInvoice, invoice) =>
    invoice.createdAt > latestInvoice.createdAt ? invoice : latestInvoice,
  );

  return {
    prefix: latest.invoiceFields.invoiceDetails.prefix,
    serialNumber: incrementSerialNumber(latest.invoiceFields.invoiceDetails.serialNumber, defaults.serialNumber),
  };
};
