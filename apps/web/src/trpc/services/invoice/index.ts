import { updateInvoiceStatus } from "./updateInvoiceStatus";
import { insertInvoice } from "./insertInvoice";
import { deleteInvoice } from "./deleteInvoice";
import { createTRPCRouter } from "@/trpc/init";
import { listInvoices } from "./listInvoices";

export const invoiceRouter = createTRPCRouter({
  list: listInvoices,
  insert: insertInvoice,
  updateStatus: updateInvoiceStatus,
  delete: deleteInvoice,
});
