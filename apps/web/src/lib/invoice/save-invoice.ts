import { ZodCreateInvoiceSchema } from "@/zod-schemas/invoice/create-invoice";
import type { InvoiceTypeType } from "@invoicely/db/schema/invoice";
import { forceInsertInvoice } from "../indexdb-queries/invoice";
import { asyncTryCatch } from "../neverthrow/tryCatch";
import { trpcProxyClient } from "@/trpc/client";
import { redirect } from "next/navigation";
import { AuthUser } from "@/types/auth";
import { toast } from "sonner";
export const saveInvoiceToDatabase = async (
  invoice: ZodCreateInvoiceSchema,
  user: AuthUser | undefined,
  type: InvoiceTypeType | undefined,
) => {
  if (user && user.allowedSavingData) {
    const insertedInvoice = await trpcProxyClient.invoice.insert.mutate(invoice);

    if (!insertedInvoice.success) {
      toast.error("Database Error", {
        description: `Error saving invoice to database: ${insertedInvoice.message}`,
      });
    } else {
      toast.success("Invoice saved successfully", {
        description: "Invoice saved successfully in Database",
      });

      // we will redirect user to its invoice Edit
      redirect(`/edit/server/${insertedInvoice.invoiceId}`);
    }
  } else {
    if (type === "server") {
      toast.error("Error Occured", {
        description: "Failed to save invoice to server! Please allow saving data in your account settings.",
      });
      return;
    }

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
      redirect(`/edit/local/${data}`);
    }
  }
};
