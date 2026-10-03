import type { Invoice } from "@/types/common/invoice";

interface MoveInvoiceToServerInput extends Pick<Invoice, "invoiceFields" | "status" | "paidAt"> {
  invoiceId: string;
}

interface MoveInvoiceToServerDependencies {
  saveInvoice: (input: Pick<Invoice, "invoiceFields" | "status" | "paidAt">) => Promise<{
    success: boolean;
    message: string;
    invoiceId?: string;
  }>;
  deleteLocalInvoice: (invoiceId: string) => Promise<void>;
}

function portableImage(value: string | null | undefined, base64: string | undefined, name: string) {
  if (value?.startsWith("https://") || value?.startsWith("http://") || value?.startsWith("data:image/")) {
    return value;
  }

  if (base64?.startsWith("data:image/")) {
    return base64;
  }

  if (!value && !base64) {
    return value;
  }

  throw new Error(`The invoice ${name} is unavailable. Open the invoice and select the image again before moving it.`);
}

async function moveInvoiceToServer(
  { invoiceId, invoiceFields, status, paidAt }: MoveInvoiceToServerInput,
  { saveInvoice, deleteLocalInvoice }: MoveInvoiceToServerDependencies,
): Promise<{ invoiceId: string; localCopyRemoved: boolean }> {
  const company = invoiceFields.companyDetails;
  const result = await saveInvoice({
    invoiceFields: {
      ...invoiceFields,
      companyDetails: {
        ...company,
        logo: portableImage(company.logo, company.logoBase64, "logo"),
        signature: portableImage(company.signature, company.signatureBase64, "signature"),
      },
    },
    status,
    paidAt,
  });

  if (!result.success || !result.invoiceId) {
    throw new Error(result.success ? "The server did not confirm the saved invoice." : result.message);
  }

  try {
    await deleteLocalInvoice(invoiceId);
    return { invoiceId: result.invoiceId, localCopyRemoved: true };
  } catch {
    return { invoiceId: result.invoiceId, localCopyRemoved: false };
  }
}

export { moveInvoiceToServer };
export type { MoveInvoiceToServerInput, MoveInvoiceToServerDependencies };
