import type { InvoiceTypeType, InvoiceStatusType } from "@invoicely/db/schema/invoice";
import { ZodCreateInvoiceSchema } from "@/zod-schemas/invoice/create-invoice";

export interface IDBInvoice {
  id: string;
  type: InvoiceTypeType;
  createdAt: Date;
  updatedAt: Date;
  status: InvoiceStatusType;
  paidAt: Date | null;
  invoiceFields: ZodCreateInvoiceSchema;
}

export interface IDBImage {
  id: string;
  type: "logo" | "signature";
  createdAt: Date;
  base64: string;
}
