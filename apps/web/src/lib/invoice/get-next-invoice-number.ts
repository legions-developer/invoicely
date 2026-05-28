import { createInvoiceSchemaDefaultValues } from "@/zod-schemas/invoice/create-invoice";

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
 * Increment the trailing run of digits in a serial number while preserving any
 * leading text and the zero-padding width, e.g. "0001" -> "0002",
 * "2025-009" -> "2025-010", "INV-0099" -> "INV-0100".
 */
const incrementSerialNumber = (serialNumber: string): string => {
  const match = serialNumber.match(/^(.*?)(\d+)(\D*)$/);

  // Non-numeric serial number ~ start a fresh sequence from the default.
  if (!match) return createInvoiceSchemaDefaultValues.invoiceDetails.serialNumber;

  const [, leading, digits, trailing] = match;
  const next = (Number(digits) + 1).toString().padStart(digits.length, "0");

  return `${leading}${next}${trailing}`;
};

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
    serialNumber: incrementSerialNumber(latest.invoiceFields.invoiceDetails.serialNumber),
  };
};
