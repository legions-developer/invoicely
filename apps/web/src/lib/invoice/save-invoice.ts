import { ZodCreateInvoiceSchema } from "@/zod-schemas/invoice/create-invoice";
import { forceInsertInvoice } from "../indexdb-queries/invoice";
import { asyncTryCatch } from "../neverthrow/tryCatch";
import { trpcProxyClient } from "@/trpc/client";
import { redirect } from "next/navigation";
import { AuthUser } from "@/types/auth";
import { toast } from "sonner";
export const saveInvoiceToDatabase = async (invoice: ZodCreateInvoiceSchema, user: AuthUser | undefined) => {
  if (user && user.allowedSavingData) {
    const insertedInvoice = await trpcProxyClient.invoice.insert.mutate(invoice);

    if (!insertedInvoice.success) {
      toast.error("Database Error", {
        description: `Error saving invoice to database`,
      });
    } else {
      toast.success("Invoice saved successfully", {
        description: "Invoice saved successfully in Database",
      });

      // we will redirect user to its invoice Edit
      redirect(`/edit/postgres/${insertedInvoice.invoiceId}`);
    }
  } else {
    const { success, data } = await asyncTryCatch(forceInsertInvoice(invoice));

    if (!success || !data) {
      toast.error("IndexDB Error", {
        description: "Error saving invoice to indexedDB",
      });
    } else {
      toast.success("Invoice saved successfully", {
        description: "Invoice saved successfully in IndexDB",
      });

      // we will redirect user to its invoice Edit
      redirect(`/edit/index_db/${data}`);
    }
  }
};
