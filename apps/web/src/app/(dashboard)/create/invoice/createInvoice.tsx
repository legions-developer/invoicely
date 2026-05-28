"use client";

import { createInvoiceSchemaDefaultValues } from "@/zod-schemas/invoice/create-invoice";
import { getDefaultDetails } from "@/lib/indexdb-queries/defaultDetails";
import { useNextInvoiceNumber } from "@/hooks/use-next-invoice-number";
import PDFLoading from "@/components/layout/pdf/pdf-loading";
import { SUCCESS_MESSAGES } from "@/constants/issues";
import { useQuery } from "@tanstack/react-query";
import InvoicePage from "./invoice";
import React from "react";

// Entry point for creating a fresh invoice. Computes the next invoice number
// and pulls the user's saved default details (both from local stores), feeding
// them as the form's defaults before mounting, so the shared InvoicePage stays
// unaware of create-vs-edit. Editing existing invoices goes through EditInvoice.
const CreateInvoice = () => {
  const { nextInvoiceNumber, isLoading } = useNextInvoiceNumber();
  const { data: savedDetails, isPending: isDetailsLoading } = useQuery({
    queryKey: ["idb-default-details"],
    queryFn: getDefaultDetails,
  });

  if (isLoading || isDetailsLoading) {
    return (
      <PDFLoading
        message={SUCCESS_MESSAGES.PREPARING_INVOICE}
        description={SUCCESS_MESSAGES.PREPARING_INVOICE_DESCRIPTION}
      />
    );
  }

  const defaultInvoice = {
    ...createInvoiceSchemaDefaultValues,
    companyDetails: {
      ...createInvoiceSchemaDefaultValues.companyDetails,
      ...(savedDetails?.companyDetails ?? {}),
    },
    clientDetails: {
      ...createInvoiceSchemaDefaultValues.clientDetails,
      ...(savedDetails?.clientDetails ?? {}),
    },
    invoiceDetails: {
      ...createInvoiceSchemaDefaultValues.invoiceDetails,
      prefix: nextInvoiceNumber.prefix,
      serialNumber: nextInvoiceNumber.serialNumber,
    },
  };

  return <InvoicePage defaultInvoice={defaultInvoice} />;
};

export default CreateInvoice;
