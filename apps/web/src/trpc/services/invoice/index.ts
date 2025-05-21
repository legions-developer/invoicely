import { createTRPCRouter } from "@/trpc/init";
import { listInvoices } from "./listInvoices";

export const invoiceRouter = createTRPCRouter({
  list: listInvoices,
});
