import { ZodCreateInvoiceSchema } from "@/zod-schemas/invoice/create-invoice";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "@/constants/issues";
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
      toast.error(ERROR_MESSAGES.DATABASE_ERROR, {
        description: ERROR_MESSAGES.FAILED_TO_INSERT_DATA,
      });
    } else {
      toast.success(SUCCESS_MESSAGES.INVOICE_SAVED, {
        description: SUCCESS_MESSAGES.INVOICE_SAVED_DESCRIPTION,
      });

      // we will redirect user to its invoice Edit
      redirect(`/edit/server/${insertedInvoice.invoiceId}`);
    }
  } else {
    if (type === "server") {
      toast.error(ERROR_MESSAGES.TOAST_DEFAULT_TITLE, {
        description: ERROR_MESSAGES.NOT_ALLOWED_TO_SAVE_DATA,
      });
      return;
    }

    const { success, data } = await asyncTryCatch(forceInsertInvoice(invoice));

    if (!success || !data) {
      toast.error(ERROR_MESSAGES.INDEXDB_ERROR, {
        description: ERROR_MESSAGES.FAILED_TO_INSERT_DATA,
      });
    } else {
      toast.success(SUCCESS_MESSAGES.INVOICE_SAVED, {
        description: SUCCESS_MESSAGES.INVOICE_SAVED_DESCRIPTION,
      });

      // we will redirect user to its invoice Edit
      redirect(`/edit/local/${data}`);
    }
  }
};
