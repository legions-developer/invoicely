"use client";

import { buildFinancialDashboard, mergeDashboardInvoices } from "@/lib/dashboard/financial-dashboard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowUpRight, Plus, RefreshCw, Wallet } from "lucide-react";
import { DashboardOverview, TopClients } from "./dashboard-panels";
import { getAllInvoices } from "@/lib/indexdb-queries/invoice";
import { MonthlyTrend } from "./monthly-trend.client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/client-auth";
import { useTRPCClient } from "@/trpc/client";
import { LINKS } from "@/constants/links";
import { useMemo, useState } from "react";
import Link from "next/link";

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
  const currency = dashboard.currencies.find((entry) => entry.currency === selectedCurrency) ?? dashboard.currencies[0];
  const isLoading = isSessionPending || localInvoices.isLoading || (!!session?.user && serverInvoices.isLoading);
  const isRefreshing = localInvoices.isFetching || (!!session?.user && serverInvoices.isFetching);
  const hasError = localInvoices.isError || (!!session?.user && serverInvoices.isError) || !!sessionError;

  function refresh() {
    void localInvoices.refetch();
    if (sessionError) void refetchSession();
    else if (session?.user) void serverInvoices.refetch();
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-7 p-4 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-muted-foreground mb-1 text-xs font-medium tracking-widest uppercase">Financial overview</p>
          <h1 className="instrument-serif text-4xl tracking-tight md:text-5xl">Dashboard</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            A clear view of what’s paid, what’s due, and who you work with.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={refresh}
            disabled={isLoading || isRefreshing}
            aria-label="Refresh dashboard"
          >
            <RefreshCw aria-hidden="true" className="size-3.5" />
            {isRefreshing ? "Refreshing…" : "Refresh"}
          </Button>
          <Button asChild>
            <Link href={LINKS.CREATE.INVOICE}>
              <Plus aria-hidden="true" />
              Create invoice
            </Link>
          </Button>
        </div>
      </div>

      {hasError ? (
        <Alert variant="warning">
          <AlertTitle>Some invoice data is unavailable</AlertTitle>
          <AlertDescription>
            <p>
              {sessionError ? "We couldn’t check your sign-in status. " : ""}
              {localInvoices.isError ? "Invoices on this device couldn’t be loaded. " : ""}
              {session?.user && serverInvoices.isError ? "Saved server invoices couldn’t be refreshed. " : ""}
              Figures below may be incomplete or out of date. Use Refresh to try again.
            </p>
          </AlertDescription>
        </Alert>
      ) : null}

      {isLoading ? (
        <div role="status" className="flex min-h-80 items-center justify-center rounded-xl border border-dashed">
          <p className="text-muted-foreground text-sm">Loading your financial overview…</p>
        </div>
      ) : !currency ? (
        <div className="flex min-h-96 flex-col items-center justify-center rounded-xl border border-dashed px-6 text-center">
          <div className="bg-muted mb-5 rounded-full p-4">
            <Wallet className="text-muted-foreground size-7" aria-hidden="true" />
          </div>
          <h2 className="instrument-serif text-3xl">
            {hasError ? "Your overview is unavailable" : "Your finances, at a glance"}
          </h2>
          <p className="text-muted-foreground mt-2 max-w-sm text-sm leading-relaxed">
            {hasError
              ? "Refresh to load your invoices and see your financial overview."
              : "Create your first invoice to start tracking collections, outstanding amounts, and your top clients."}
          </p>
          {!hasError ? (
            <Button className="mt-5" asChild>
              <Link href={LINKS.CREATE.INVOICE}>
                Create your first invoice
                <ArrowUpRight aria-hidden="true" />
              </Link>
            </Button>
          ) : null}
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-end justify-between gap-4 border-b pb-5">
            <div>
              <label htmlFor="dashboard-currency" className="mb-2 block text-xs font-medium">
                Currency
              </label>
              <select
                id="dashboard-currency"
                value={currency.currency}
                onChange={(event) => setSelectedCurrency(event.target.value)}
                className="border-input bg-background focus-visible:ring-ring h-9 min-w-44 rounded-md border px-3 text-sm outline-none focus-visible:ring-2"
              >
                {dashboard.currencies.map((entry) => (
                  <option key={entry.currency} value={entry.currency}>
                    {entry.currency} · {entry.invoiceCount} {entry.invoiceCount === 1 ? "invoice" : "invoices"}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-muted-foreground text-xs leading-relaxed sm:text-right">
              {dashboard.invoiceCount} {dashboard.invoiceCount === 1 ? "invoice" : "invoices"} across{" "}
              {dashboard.currencies.length} {dashboard.currencies.length === 1 ? "currency" : "currencies"}
              <br />
              Each currency is reported separately. No conversion or combined totals.
            </p>
          </div>

          <DashboardOverview data={currency} />

          <section className="min-w-0 rounded-xl border p-5 md:p-6" aria-labelledby="monthly-trends-title">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 id="monthly-trends-title" className="text-base font-semibold">
                  Monthly trends
                </h2>
                <p className="text-muted-foreground mt-1 text-xs">
                  Billed by invoice date. Collected by payment date. Amounts in {currency.currency}.
                </p>
              </div>
              <div>
                <label htmlFor="dashboard-period" className="sr-only">
                  Trend period
                </label>
                <select
                  id="dashboard-period"
                  value={months}
                  onChange={(event) => setMonths(event.target.value === "12" ? 12 : 6)}
                  className="border-input bg-background focus-visible:ring-ring h-8 rounded-md border px-2 text-xs outline-none focus-visible:ring-2"
                >
                  <option value={6}>Last 6 months</option>
                  <option value={12}>Last 12 months</option>
                </select>
              </div>
            </div>
            <MonthlyTrend data={currency} />
            {currency.undatedCollectedCount > 0 ? (
              <p className="mt-4 rounded-md bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-800 dark:text-amber-300">
                {currency.undatedCollectedCount} paid{" "}
                {currency.undatedCollectedCount === 1 ? "invoice has" : "invoices have"} no payment date. Included in
                collected totals, excluded from monthly collections.
              </p>
            ) : null}
          </section>

          <TopClients data={currency} />

          <div className="text-muted-foreground flex flex-wrap items-center justify-between gap-3 border-t pt-4 text-xs">
            <p>
              {session?.user
                ? "Includes invoices on this device and in your account."
                : "Showing invoices on this device. Sign in to include your saved server invoices."}
            </p>
            <Link
              className="text-foreground inline-flex items-center gap-1 underline-offset-4 hover:underline"
              href={LINKS.INVOICES}
            >
              Manage invoices
              <ArrowUpRight className="size-3" aria-hidden="true" />
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

export { FinancialDashboard };
