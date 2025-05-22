import { ZodCreateInvoiceSchema } from "@/zod-schemas/invoice/create-invoice";
import { forceInsertInvoice } from "../indexdb-queries/invoice";
import { asyncTryCatch } from "../neverthrow/tryCatch";
import { trpcProxyClient } from "@/trpc/client";
import { AuthUser } from "@/types/auth";
import { toast } from "sonner";

export const saveInvoiceToDatabase = async (invoice: ZodCreateInvoiceSchema, user: AuthUser | undefined) => {
  if (user && user.allowedSavingData) {
    const insertedInvoice = await trpcProxyClient.invoice.insert.mutate(invoice);

    if (!insertedInvoice.success) {
      toast.error("Database Error", {
        description: `Error saving invoice to database`,
      });
    }
  } else {
    const { success } = await asyncTryCatch(forceInsertInvoice(invoice));

    if (!success) {
      toast.error("IndexDB Error", {
        description: "Error saving invoice to indexedDB",
      });
    }
  }
};
