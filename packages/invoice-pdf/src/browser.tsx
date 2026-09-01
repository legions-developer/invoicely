"use client";

import { createInvoicePdfDocument, type InvoicePdfTemplateName } from "./document";
import type { ZodCreateInvoiceSchema } from "@invoicely/invoice-core";
import { pdf } from "@react-pdf/renderer";

export interface CreateInvoicePdfBlobOptions {
  invoiceData: ZodCreateInvoiceSchema;
  template?: InvoicePdfTemplateName;
}

export async function createInvoicePdfBlob({ invoiceData, template }: CreateInvoicePdfBlobOptions): Promise<Blob> {
  return pdf(createInvoicePdfDocument(invoiceData, template)).toBlob();
}
