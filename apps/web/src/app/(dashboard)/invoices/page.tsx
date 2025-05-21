"use client";

import { columnConfig, columns } from "@/components/table-columns/invoices";
import { getAllInvoices } from "@/lib/indexdb-queries/invoice";
import { DataTable } from "@/components/ui/data-table";
import { useIDBQuery } from "@/hooks/use-idb-query";
import { trpc } from "@/trpc/client";
import React from "react";

const Page = () => {
  const trpcData = trpc.invoice.list.useQuery();
  const idbData = useIDBQuery(getAllInvoices);

  const isLoading = trpcData.isLoading || idbData.isLoading;

  // Combine and ensure data is an array
  const data = [...(trpcData.data ?? []), ...(idbData.data ?? [])];

  return (
    <div className="dash-page p-4">
      <DataTable isLoading={isLoading} data={data} columns={columns} columnConfig={columnConfig} />
    </div>
  );
};

export default Page;
