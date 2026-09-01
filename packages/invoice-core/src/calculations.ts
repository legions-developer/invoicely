import type { ZodCreateInvoiceSchema } from "./schema";
import Decimal from "decimal.js";

export interface InvoiceTotals {
  subtotal: Decimal;
  total: Decimal;
}

export function calculateInvoiceSubtotal(data: ZodCreateInvoiceSchema): Decimal {
  return data.items.reduce(
    (subtotal, item) => subtotal.plus(new Decimal(item.quantity).times(item.unitPrice)),
    new Decimal(0),
  );
}

export function calculateInvoiceTotals(data: ZodCreateInvoiceSchema): InvoiceTotals {
  const subtotal = calculateInvoiceSubtotal(data);
  const total = data.invoiceDetails.billingDetails.reduce((amount, adjustment) => {
    if (adjustment.type === "fixed") {
      return amount.plus(adjustment.value);
    }

    return amount.plus(subtotal.times(adjustment.value).dividedBy(100));
  }, subtotal);

  return { subtotal, total };
}

export function getSubTotalValue(data: ZodCreateInvoiceSchema): number {
  return calculateInvoiceSubtotal(data).toNumber();
}

export function getTotalValue(data: ZodCreateInvoiceSchema): number {
  return calculateInvoiceTotals(data).total.toNumber();
}
