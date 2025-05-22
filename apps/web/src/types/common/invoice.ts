import type { InvoiceStatusType, InvoiceTypeType } from "@invoicely/db/schema/invoice";
import { ZodCreateInvoiceSchema } from "@/zod-schemas/invoice/create-invoice";

export interface Invoice {
  id: string;
  type: InvoiceTypeType;
  createdAt: Date;
  updatedAt: Date;
  status: InvoiceStatusType;
  paidAt: Date | null;
  invoiceFields: ZodCreateInvoiceSchema;
}
