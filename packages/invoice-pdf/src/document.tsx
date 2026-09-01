import type { InvoiceTemplateName, ZodCreateInvoiceSchema } from "@invoicely/invoice-core";
import type { DocumentProps } from "@react-pdf/renderer";
import { DefaultPDF } from "./templates/default";
import { VercelPDF } from "./templates/vercel";
import type { ReactElement } from "react";

export type InvoicePdfTemplateName = InvoiceTemplateName | undefined;

export function createInvoicePdfDocument(
  invoiceData: ZodCreateInvoiceSchema,
  template: InvoicePdfTemplateName = invoiceData.invoiceDetails.theme.template,
): ReactElement<DocumentProps> {
  if (template === "vercel") {
    return (<VercelPDF data={invoiceData} />) as ReactElement<DocumentProps>;
  }

  return (<DefaultPDF data={invoiceData} />) as ReactElement<DocumentProps>;
}
