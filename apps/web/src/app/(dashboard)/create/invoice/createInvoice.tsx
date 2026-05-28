"use client";

import { createInvoiceSchemaDefaultValues } from "@/zod-schemas/invoice/create-invoice";
import { useNextInvoiceNumber } from "@/hooks/use-next-invoice-number";
import PDFLoading from "@/components/layout/pdf/pdf-loading";
import { SUCCESS_MESSAGES } from "@/constants/issues";
import InvoicePage from "./invoice";
import React from "react";

// Entry point for creating a fresh invoice. Computes the next invoice number
// from the latest saved invoice (across both local and server stores) and feeds
// it as the form's default before mounting, so the shared InvoicePage stays
// unaware of create-vs-edit. Editing existing invoices goes through EditInvoice.
const CreateInvoice = () => {
  const { nextInvoiceNumber, isLoading } = useNextInvoiceNumber();

  if (isLoading) {
    return (
      <PDFLoading
        message={SUCCESS_MESSAGES.PREPARING_INVOICE}
        description={SUCCESS_MESSAGES.PREPARING_INVOICE_DESCRIPTION}
      />
    );
  }

  const defaultInvoice = {
    ...createInvoiceSchemaDefaultValues,
    invoiceDetails: {
      ...createInvoiceSchemaDefaultValues.invoiceDetails,
      prefix: nextInvoiceNumber.prefix,
      serialNumber: nextInvoiceNumber.serialNumber,
    },
  };

  return <InvoicePage defaultInvoice={defaultInvoice} />;
};

export default CreateInvoice;
