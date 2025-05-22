"use client";

import type { InvoiceTypeType } from "@invoicely/db/schema/invoice";
import InvoicePage from "@/app/(dashboard)/create/invoice/page";
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

      if (type === "index_db") {
        // Fetching invoice from indexedDB
        fetchedInvoice = await getInvoiceById(id);
      } else {
        // Fetching invoice from postgres
        fetchedInvoice = await trpcProxyClient.invoice.get.query({
          id: id,
        });
      }

      if (fetchedInvoice) {
        setInvoice(fetchedInvoice);
        setIsLoading(false);
      } else {
        throw new Error("Invoice not found! Please try again later.");
      }
    };

    fetchInvoice();
  }, [id, type]);

  if (isLoading) {
    return <PDFLoading message="Fetching Invoice..." description="Please wait while we fetch the invoice." />;
  }

  return <InvoicePage defaultInvoice={invoice?.invoiceFields} />;
};

export default EditInvoice;
