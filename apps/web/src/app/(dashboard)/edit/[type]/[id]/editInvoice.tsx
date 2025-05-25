"use client";

import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "@/constants/issues";
import type { InvoiceTypeType } from "@invoicely/db/schema/invoice";
import InvoicePage from "@/app/(dashboard)/create/invoice/invoice";
import { getInvoiceById } from "@/lib/indexdb-queries/invoice";
import PDFLoading from "@/components/layout/pdf/pdf-loading";
import React, { useEffect, useState } from "react";
import { Invoice } from "@/types/common/invoice";
import { trpcProxyClient } from "@/trpc/client";

interface EditInvoiceProps {
  type: InvoiceTypeType;
  id: string;
}

const EditInvoice = ({ type, id }: EditInvoiceProps) => {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInvoice = async () => {
      setIsLoading(true);
      let fetchedInvoice: Invoice | undefined;

      if (type === "local") {
        // Fetching invoice from localdb
        fetchedInvoice = await getInvoiceById(id);
      } else {
        // Fetching invoice from server
        fetchedInvoice = await trpcProxyClient.invoice.get.query({
          id: id,
        });
      }

      if (fetchedInvoice) {
        if (type === "local") {
          // we need to convert image url and sig url to local base64
          const invoiceFields = fetchedInvoice.invoiceFields;
          const imageBase64 = invoiceFields.companyDetails.logoBase64;
          const sigBase64 = invoiceFields.companyDetails.signatureBase64;

          if (!invoiceFields.companyDetails.logo?.startsWith("https://")) {
            invoiceFields.companyDetails.logo = imageBase64;
          }
          if (!invoiceFields.companyDetails.signature?.startsWith("https://")) {
            invoiceFields.companyDetails.signature = sigBase64;
          }

          setInvoice(fetchedInvoice);
        } else {
          setInvoice(fetchedInvoice);
        }
        setIsLoading(false);
      } else {
        throw new Error(ERROR_MESSAGES.INVOICE_NOT_FOUND);
      }
    };

    fetchInvoice();
  }, [id, type]);

  if (isLoading) {
    return (
      <PDFLoading
        message={SUCCESS_MESSAGES.FETCHING_INVOICE}
        description={SUCCESS_MESSAGES.FETCHING_INVOICE_DESCRIPTION}
      />
    );
  }

  return <InvoicePage defaultInvoice={invoice?.invoiceFields} />;
};

export default EditInvoice;
