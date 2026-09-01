import { createInvoiceDefaultValues } from "@invoicely/invoice-core";

export {
  createInvoiceFieldKeyNumberValuesSchema,
  createInvoiceFieldKeyStringValuesSchema,
  createInvoiceItemSchema,
  createInvoiceSchema,
  invoiceValueTypeSchema as valueType,
} from "@invoicely/invoice-core";
export type { ZodCreateInvoiceSchema } from "@invoicely/invoice-core";

export const createInvoiceSchemaDefaultValues = createInvoiceDefaultValues();
