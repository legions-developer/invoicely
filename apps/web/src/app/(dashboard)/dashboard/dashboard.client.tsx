"use client";

import { buildFinancialDashboard, mergeDashboardInvoices } from "@/lib/dashboard/financial-dashboard";
import { getAllInvoices } from "@/lib/indexdb-queries/invoice";
import { DashboardView } from "./dashboard-view.client";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/lib/client-auth";
import { useTRPCClient } from "@/trpc/client";
import { useMemo, useState } from "react";

function FinancialDashboard() {
  const trpcClient = useTRPCClient();
  const { data: session, isPending: isSessionPending, error: sessionError, refetch: refetchSession } = useSession();
  const [selectedCurrency, setSelectedCurrency] = useState("");
  const [months, setMonths] = useState<6 | 12>(6);

  const localInvoices = useQuery({
    queryKey: ["idb-invoices"],
    queryFn: getAllInvoices,
    staleTime: 0,
  });
  const serverInvoices = useQuery({
    // Scope cached financial data to the signed-in account.
    queryKey: ["dashboard-invoices", session?.user.id],
    queryFn: () => trpcClient.invoice.dashboard.query(),
    enabled: !!session?.user && !isSessionPending && !sessionError,
    staleTime: 0,
  });

  const serverData = session?.user && !sessionError ? serverInvoices.data : undefined;
  const today = new Date().setHours(0, 0, 0, 0);
  const dashboard = useMemo(
    () =>
      buildFinancialDashboard(mergeDashboardInvoices(localInvoices.data ?? [], serverData ?? []), {
        months,
        now: new Date(today),
      }),
    // Refresh the date-sensitive overdue calculation when the page rerenders on a new day.
    [localInvoices.data, serverData, months, today],
  );
  const isLoading = isSessionPending || localInvoices.isLoading || (!!session?.user && serverInvoices.isLoading);
  const isRefreshing = localInvoices.isFetching || (!!session?.user && serverInvoices.isFetching);
  const hasError = localInvoices.isError || (!!session?.user && serverInvoices.isError) || !!sessionError;

  function refresh() {
    void localInvoices.refetch();
    if (sessionError) void refetchSession();
    else if (session?.user) void serverInvoices.refetch();
  }

  const errorMessage = hasError
    ? [
        sessionError ? "We couldn’t check your sign-in status." : "",
        localInvoices.isError ? "Invoices on this device couldn’t be loaded." : "",
        session?.user && serverInvoices.isError ? "Saved server invoices couldn’t be refreshed." : "",
        "Figures may be incomplete or out of date. Use Refresh to try again.",
      ]
        .filter(Boolean)
        .join(" ")
    : undefined;

  return (
    <DashboardView
      dashboard={dashboard}
      selectedCurrency={selectedCurrency}
      onCurrencyChange={setSelectedCurrency}
      months={months}
      onMonthsChange={setMonths}
      isLoading={isLoading}
      isRefreshing={isRefreshing}
      onRefresh={refresh}
      errorMessage={errorMessage}
      signedIn={!!session?.user}
    />
  );
}

export { FinancialDashboard };
