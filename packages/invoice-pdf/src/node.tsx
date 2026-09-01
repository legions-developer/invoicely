import { createInvoiceSchema, type ZodCreateInvoiceSchema } from "@invoicely/invoice-core";
import { createInvoicePdfDocument, type InvoicePdfTemplateName } from "./document";
import { configureInvoicePdfFontDirectory } from "./fonts";
import { renderToBuffer } from "@react-pdf/renderer";

export interface RenderInvoicePdfOptions {
  invoiceData: ZodCreateInvoiceSchema;
  fontDirectory: string;
  template?: InvoicePdfTemplateName;
}

export async function renderInvoicePdfToBuffer({
  invoiceData,
  fontDirectory,
  template,
}: RenderInvoicePdfOptions): Promise<Buffer> {
  const validatedInvoice = createInvoiceSchema.parse(invoiceData);
  configureInvoicePdfFontDirectory(fontDirectory);

  return renderToBuffer(createInvoicePdfDocument(validatedInvoice, template));
}
