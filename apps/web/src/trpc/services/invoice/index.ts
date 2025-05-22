import { insertInvoice } from "./insertInvoice";
import { createTRPCRouter } from "@/trpc/init";
import { listInvoices } from "./listInvoices";
export const invoiceRouter = createTRPCRouter({
  list: listInvoices,
  insert: insertInvoice,
});
