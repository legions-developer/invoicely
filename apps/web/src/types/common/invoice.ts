import { ZodCreateInvoiceSchema } from "@/zod-schemas/invoice/create-invoice";
import { schema } from "@invoicely/db";

export interface Invoice {
  id: string;
  type: schema.InvoiceTypeType;
  createdAt: Date;
  updatedAt: Date;
  status: schema.InvoiceStatusType;
  paidAt: Date | null;
  invoiceFields: ZodCreateInvoiceSchema;
}
