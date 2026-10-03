import { ZodCreateInvoiceSchema } from "@/zod-schemas/invoice/create-invoice";
import { Button } from "@/components/ui/button";
import { UseFormReturn } from "react-hook-form";
import * as React from "react";

import {
  Dialog,
  DialogContent,
  DialogContentContainer,
  DialogDescription,
  DialogHeader,
  DialogHeaderContainer,
  DialogIcon,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { importInvoiceColumnConfig, importInvoiceColumns } from "@/components/table-columns/invoices";
import { getAllInvoices } from "@/lib/indexdb-queries/invoice";
import { DataTable } from "@/components/ui/data-table";
import { InboxArrowDownIcon } from "@/assets/icons";
import { Invoice } from "@/types/common/invoice";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/lib/client-auth";
import { useTRPC } from "@/trpc/client";

const ImportInvoice = ({ form }: { form: UseFormReturn<ZodCreateInvoiceSchema> }) => {
  const [open, setOpen] = React.useState(false);

  const trpc = useTRPC();
  const { data: session } = useSession();

  // Fetching Invoices from the Postgres (Server)
  const trpcData = useQuery({
    ...trpc.invoice.list.queryOptions(),
    enabled: !!session?.user, // Only fetch if user is logged in
  });

  // Fetching Invoices from the LocalDB
  const idbData = useQuery({
    queryKey: ["idb-invoices"],
    queryFn: getAllInvoices,
  });

  const isLoading = trpcData.isLoading || idbData.isLoading;

  // Combine and ensure data is an array
  const data = [...(trpcData.data ?? []), ...(idbData.data ?? [])];

  const handleRowClick = (invoice: Invoice) => {
    if (invoice.type === "local") {
      // we need to convert image url and sig url to local base64
      const invoiceFields = invoice.invoiceFields;
      const imageBase64 = invoiceFields.companyDetails.logoBase64;
      const sigBase64 = invoiceFields.companyDetails.signatureBase64;

      if (!invoiceFields.companyDetails.logo?.startsWith("https://")) {
        invoiceFields.companyDetails.logo = imageBase64;
      }
      if (!invoiceFields.companyDetails.signature?.startsWith("https://")) {
        invoiceFields.companyDetails.signature = sigBase64;
      }
    }

    // Reset form field to imported invoice
    form.reset(invoice.invoiceFields);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <InboxArrowDownIcon className="text-muted-foreground" />
          <span>Import</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] grid-cols-1 grid-rows-[auto_minmax(0,1fr)] sm:max-w-3xl">
        <DialogHeaderContainer>
          <DialogIcon>
            <InboxArrowDownIcon />
          </DialogIcon>
          <DialogHeader>
            <DialogTitle>Import Invoice</DialogTitle>
            <DialogDescription>Click on an invoice to import the data</DialogDescription>
          </DialogHeader>
        </DialogHeaderContainer>
        <DialogContentContainer className="min-w-0 overflow-y-auto">
          <DataTable
            isLoading={isLoading}
            data={data}
            columns={importInvoiceColumns}
            columnConfig={importInvoiceColumnConfig}
            defaultSorting={[{ id: "createdAt", desc: true }]}
            onRowClick={handleRowClick}
          />
        </DialogContentContainer>
      </DialogContent>
    </Dialog>
  );
};

export default ImportInvoice;
