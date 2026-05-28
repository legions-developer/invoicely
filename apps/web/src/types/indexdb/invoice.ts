import type { InvoiceTypeType, InvoiceStatusType } from "@invoicely/db/schema/invoice";
import { ZodDefaultDetailsSchema } from "@/zod-schemas/invoice/default-details";
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

export interface IDBDefaultDetails extends ZodDefaultDetailsSchema {
  id: string;
  updatedAt: Date;
}
