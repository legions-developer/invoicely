"use client";

import { Alert, AlertButtonGroup, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { columnConfig, columns } from "@/components/table-columns/invoices";
import { getAllInvoices } from "@/lib/indexdb-queries/invoice";
import { DataTable } from "@/components/ui/data-table";
import { useIDBQuery } from "@/hooks/use-idb-query";
import { Button } from "@/components/ui/button";
import { trpc } from "@/trpc/client";
import React from "react";

const Page = () => {
  const trpcData = trpc.invoice.list.useQuery();
  const idbData = useIDBQuery(getAllInvoices);

  const isLoading = trpcData.isLoading || idbData.isLoading;

  // Combine and ensure data is an array
  const data = [...(trpcData.data ?? []), ...(idbData.data ?? [])];

  return (
    <div className="dash-page gap-4 p-4">
      {trpcData.isError && (
        <Alert variant="destructive">
          <AlertTitle>Fetch Failed!</AlertTitle>
          <AlertDescription>
            We were unable to fetch your invoices from the server. Please try again later.
          </AlertDescription>
          <AlertButtonGroup>
            <Button onClick={() => trpcData.refetch()} variant="destructive" size="xs">
              Retry
            </Button>
          </AlertButtonGroup>
        </Alert>
      )}
      <DataTable
        isLoading={isLoading}
        data={data}
        columns={columns}
        columnConfig={columnConfig}
        defaultSorting={[{ id: "createdAt", desc: true }]}
      />
    </div>
  );
};

export default Page;
