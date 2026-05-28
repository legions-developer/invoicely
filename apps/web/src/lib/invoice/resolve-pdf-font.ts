import { CJK_FALLBACK_FAMILY, INVOICE_BODY_FONTS, NOTO_SANS_SC_FONT } from "@/constants/pdf-fonts";
import { ZodCreateInvoiceSchema } from "@/zod-schemas/invoice/create-invoice";
import { Font } from "@react-pdf/renderer";

// CJK radicals/symbols through Unified Ideographs (+ Ext A), compatibility ideographs,
// and halfwidth/fullwidth forms — i.e. the glyphs the Latin body fonts can't render.
const CJK_REGEX = /[⺀-鿿豈-﫿＀-￯]/;

function collectInvoiceText(data: ZodCreateInvoiceSchema): string {
  const { companyDetails, clientDetails, metadata, items, invoiceDetails } = data;

  const parts = [
    companyDetails.name,
    companyDetails.address,
    clientDetails.name,
    clientDetails.address,
    metadata.notes,
    metadata.terms,
    invoiceDetails.paymentTerms,
    ...companyDetails.metadata.flatMap((field) => [field.label, field.value]),
    ...clientDetails.metadata.flatMap((field) => [field.label, field.value]),
    ...metadata.paymentInformation.flatMap((field) => [field.label, field.value]),
    ...invoiceDetails.billingDetails.map((billing) => billing.label),
    ...items.flatMap((item) => [item.name, item.description]),
  ];

  return parts.filter(Boolean).join("");
}

function invoiceContainsCJK(data: ZodCreateInvoiceSchema): boolean {
  return CJK_REGEX.test(collectInvoiceText(data));
}

// Registers the selected body font (and the Noto Sans SC fallback when the invoice
// contains CJK text) and returns the fontFamily stack for createTw's `default` slot.
// The CJK font is only registered/loaded when actually needed, so Latin-only invoices
// don't pay for it. Per-glyph substitution then renders Chinese via the fallback.
function resolveBodyFontFamily(data: ZodCreateInvoiceSchema, nativeFamily: string): string[] {
  const selected = data.invoiceDetails.theme.font;
  let bodyFamily = nativeFamily;

  if (selected && INVOICE_BODY_FONTS[selected]) {
    const { family, fonts } = INVOICE_BODY_FONTS[selected];
    Font.register({ family, fonts });
    bodyFamily = family;
  }

  const fontFamily = [bodyFamily];

  if (invoiceContainsCJK(data)) {
    Font.register({ family: CJK_FALLBACK_FAMILY, fonts: NOTO_SANS_SC_FONT });
    fontFamily.push(CJK_FALLBACK_FAMILY);
  }

  return fontFamily;
}

export { resolveBodyFontFamily, invoiceContainsCJK };
