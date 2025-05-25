import { ZodCreateInvoiceSchema } from "@/zod-schemas/invoice/create-invoice";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "@/constants/issues";
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
      toast.error(ERROR_MESSAGES.DATABASE_ERROR, {
        description: ERROR_MESSAGES.FAILED_TO_EDIT_INVOICE,
      });
    } else {
      toast.success(SUCCESS_MESSAGES.INVOICE_EDITED, {
        description: SUCCESS_MESSAGES.INVOICE_EDITED_DESCRIPTION,
      });
    }
  } else {
    if (type === "server") {
      toast.error(ERROR_MESSAGES.TOAST_DEFAULT_TITLE, {
        description: ERROR_MESSAGES.NOT_ALLOWED_TO_SAVE_DATA,
      });
      return;
    }

    const { success } = await asyncTryCatch(updateInvoice(id, invoice));

    if (!success) {
      toast.error(ERROR_MESSAGES.INDEXDB_ERROR, {
        description: ERROR_MESSAGES.FAILED_TO_EDIT_INVOICE,
      });
    } else {
      toast.success(SUCCESS_MESSAGES.INVOICE_EDITED, {
        description: SUCCESS_MESSAGES.INVOICE_EDITED_DESCRIPTION,
      });
    }
  }
};
