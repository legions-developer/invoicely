"use client";

import { columnConfig, columns } from "@/components/table-columns/invoices";
import { getAllInvoices } from "@/lib/indexdb-queries/invoice";
import { DataTable } from "@/components/ui/data-table";
import { useIDBQuery } from "@/hooks/use-idb-query";
import React from "react";

const Page = () => {
  const { data, isLoading } = useIDBQuery(getAllInvoices);

  return (
    <div className="dash-page p-4">
      <DataTable isLoading={isLoading} data={data} columns={columns} columnConfig={columnConfig} />
    </div>
  );
};

export default Page;
