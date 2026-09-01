import { INVOICE_BODY_FONTS, type InvoiceFontName } from "@invoicely/invoice-pdf";
import { ZodCreateInvoiceSchema } from "@/zod-schemas/invoice/create-invoice";
import { FormSelect } from "@/components/ui/form/form-select";
import { SelectItem } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";

// Body fonts a user can pick for an invoice. CJK rendering is handled automatically
// via a fallback (see resolve-pdf-font), so it is intentionally not listed here.
const availableInvoiceFonts = (Object.keys(INVOICE_BODY_FONTS) as InvoiceFontName[]).map((name) => ({
  name,
  label: INVOICE_BODY_FONTS[name].label,
}));

export const InvoiceFontSelector = ({ form }: { form: UseFormReturn<ZodCreateInvoiceSchema> }) => {
  return (
    <FormSelect
      name="invoiceDetails.theme.font"
      reactform={form}
      placeholder="Font"
      alingContent="end"
      className="min-w-28"
    >
      {availableInvoiceFonts.map((font) => (
        <SelectItem key={font.name} value={font.name}>
          <span>{font.label}</span>
        </SelectItem>
      ))}
    </FormSelect>
  );
};
