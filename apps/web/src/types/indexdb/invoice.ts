import type { InvoiceTypeType, InvoiceStatusType } from "@invoicely/db/schema/invoice";
import { ZodCreateInvoiceSchema } from "@/zod-schemas/invoice/create-invoice";
import { InvoiceImageType } from "../common/invoice";

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
  type: InvoiceImageType;
  createdAt: Date;
  base64: string;
}
