"use client";

import { getNextInvoiceNumber } from "@/lib/invoice/get-next-invoice-number";
import { getAllInvoices } from "@/lib/indexdb-queries/invoice";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/lib/client-auth";
import { useTRPC } from "@/trpc/client";
import { useMemo } from "react";

export function useNextInvoiceNumber() {
  const trpc = useTRPC();
  const { data: session } = useSession();

  // Server invoices (Postgres) ~ only fetched when the user is logged in
  const serverInvoices = useQuery({
    ...trpc.invoice.list.queryOptions(),
    enabled: !!session?.user,
  });

  // Local invoices (IndexedDB)
  const localInvoices = useQuery({
    queryKey: ["idb-invoices"],
    queryFn: getAllInvoices,
  });

  const isLoading = serverInvoices.isLoading || localInvoices.isLoading;

  const nextInvoiceNumber = useMemo(
    () => getNextInvoiceNumber([...(serverInvoices.data ?? []), ...(localInvoices.data ?? [])]),
    [serverInvoices.data, localInvoices.data],
  );

  return { nextInvoiceNumber, isLoading };
}
