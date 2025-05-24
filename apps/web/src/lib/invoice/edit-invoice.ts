import { ZodCreateInvoiceSchema } from "@/zod-schemas/invoice/create-invoice";
import { InvoiceTypeType } from "@invoicely/db/schema/invoice";
import { updateInvoice } from "../indexdb-queries/invoice";
import { asyncTryCatch } from "../neverthrow/tryCatch";
import { trpcProxyClient } from "@/trpc/client";
import { AuthUser } from "@/types/auth";
import { toast } from "sonner";

export const editInvoice = async (
  invoice: ZodCreateInvoiceSchema,
  user: AuthUser | undefined,
  type: InvoiceTypeType,
  id: string,
) => {
  if (user && user.allowedSavingData) {
    const insertedInvoice = await trpcProxyClient.invoice.edit.mutate({
      id,
      invoice,
    });

    if (!insertedInvoice.success) {
      toast.error("Database Error", {
        description: `Error editing invoice to database`,
      });
    } else {
      toast.success("Invoice edited successfully", {
        description: "Invoice edited successfully in Database",
      });
    }
  } else {
    if (type === "server") {
      toast.error("Error Occured", {
        description: "Failed to save invoice to server! Please allow saving data in your account settings.",
      });
      return;
    }

    const { success } = await asyncTryCatch(updateInvoice(id, invoice));

    if (!success) {
      toast.error("IndexDB Error", {
        description: "Error editing invoice to indexedDB",
      });
    } else {
      toast.success("Invoice edited successfully", {
        description: "Invoice edited successfully in IndexDB",
      });
    }
  }
};
