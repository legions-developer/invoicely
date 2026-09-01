import {
  buildInvoiceFromTemplate,
  calculateInvoiceTotals,
  createInvoiceDefaultValues,
  createTemplateData,
  incrementSerialNumber,
  invoiceGenerationInputSchema,
  namedInvoiceTemplateSchema,
} from "./index";
import { describe, expect, test } from "bun:test";

describe("invoice calculations", () => {
  test("uses decimal arithmetic for line items and adjustments", () => {
    const invoice = createInvoiceDefaultValues(new Date("2026-01-15T00:00:00.000Z"));
    invoice.items = [{ name: "Precision service", description: "Synthetic fixture", quantity: 3, unitPrice: 0.1 }];
    invoice.invoiceDetails.billingDetails = [
      { label: "Tax", type: "percentage", value: 10 },
      { label: "Credit", type: "fixed", value: -0.03 },
    ];

    const totals = calculateInvoiceTotals(invoice);

    expect(totals.subtotal.toString()).toBe("0.3");
    expect(totals.total.toString()).toBe("0.3");
  });
});

describe("invoice templates", () => {
  test("builds a validated invoice from JSON-friendly input", () => {
    const defaults = createInvoiceDefaultValues(new Date("2026-01-01T00:00:00.000Z"));
    const template = namedInvoiceTemplateSchema.parse({
      schemaVersion: 1,
      name: "example-studio",
      nextSerialNumber: "0042",
      data: createTemplateData(defaults),
    });
    const input = invoiceGenerationInputSchema.parse({
      clientDetails: { name: "Example Customer", address: "300 Fixture Road", metadata: [] },
      items: [{ name: "Design service", description: "Synthetic fixture", quantity: 2, unitPrice: 125.5 }],
      date: "2026-02-03T00:00:00.000Z",
    });

    const invoice = buildInvoiceFromTemplate(template, input);

    expect(invoice.invoiceDetails.serialNumber).toBe("0042");
    expect(invoice.invoiceDetails.date).toEqual(new Date("2026-02-03T00:00:00.000Z"));
    expect(invoice.companyDetails.name).toBe("Example Studio");
  });
});

describe("invoice serial numbers", () => {
  test("preserves padding and surrounding text", () => {
    expect(incrementSerialNumber("INV-0099")).toBe("INV-0100");
    expect(incrementSerialNumber("2026-009-A")).toBe("2026-010-A");
  });
});
