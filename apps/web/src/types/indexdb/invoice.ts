import { ZodCreateInvoiceSchema } from "@/zod-schemas/invoice/create-invoice";

export enum INVOICE_STATUS {
  PENDING = "pending",
  SUCCESS = "success",
  ERROR = "error",
  EXPIRED = "expired",
  REFUNDED = "refunded",
}

export enum INVOICE_TYPE {
  INDEX_DB = "index_db",
  POSTGRES = "postgres",
}

export interface IDBInvoice {
  id: string;
  type: INVOICE_TYPE;
  createdAt: Date;
  status: INVOICE_STATUS;
  paidAt: Date | null;
  data: ZodCreateInvoiceSchema;
}
