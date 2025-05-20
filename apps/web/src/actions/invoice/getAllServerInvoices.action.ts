"use server";

import { db } from "@invoicely/db";

export const getAllServerInvoices = async () => {
  const invoices = await db.query.invoices.findMany({
    with: {
      invoiceFields: {
        with: {
          clientDetails: {
            with: {
              metadata: true,
            },
          },
          companyDetails: {
            with: {
              metadata: true,
            },
          },
          invoiceDetails: {
            with: {
              billingDetails: true,
            },
          },
          metadata: {
            with: {
              paymentInformation: true,
            },
          },
          items: true,
        },
      },
    },
  });

  return invoices.map((invoice) => ({
    ...invoice,
    invoiceFields: {
      ...invoice.invoiceFields,
      items: invoice.invoiceFields.items.map((item) => ({
        ...item,
        unitPrice: item.unitPrice.toNumber(),
      })),
      invoiceDetails: {
        ...invoice.invoiceFields.invoiceDetails,
        billingDetails: invoice.invoiceFields.invoiceDetails.billingDetails.map((billingDetail) => ({
          ...billingDetail,
          value: billingDetail.value.toNumber(),
        })),
      },
    },
  }));
};
