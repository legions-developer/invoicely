"use client";

import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { ArrowUpRight, CalendarDays, CircleHelp, Plus, RefreshCw } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type FinancialDashboard } from "@/lib/dashboard/financial-dashboard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DashboardOverview, TopClients } from "./dashboard-panels";
import { MonthlyTrend } from "./monthly-trend.client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { DashboardIcon } from "@/assets/icons";
import { LINKS } from "@/constants/links";
import Link from "next/link";

interface DashboardViewProps {
  dashboard: FinancialDashboard;
  selectedCurrency: string;
  onCurrencyChange: (currency: string) => void;
  months: 6 | 12;
  onMonthsChange: (months: 6 | 12) => void;
  isLoading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  errorMessage?: string;
  signedIn: boolean;
}

function DashboardView({
  dashboard,
  selectedCurrency,
  onCurrencyChange,
  months,
  onMonthsChange,
  isLoading,
  isRefreshing,
  onRefresh,
  errorMessage,
  signedIn,
}: DashboardViewProps) {
  const currency = dashboard.currencies.find((entry) => entry.currency === selectedCurrency) ?? dashboard.currencies[0];

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-foreground/65 mt-1 text-sm">Collections, outstanding invoices, and client activity.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={onRefresh}
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
      </header>

      {errorMessage ? (
        <Alert variant="warning">
          <AlertTitle>Some invoice data is unavailable</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      {isLoading ? (
        <DashboardSkeleton />
      ) : !currency ? (
        <Empty className="bg-card min-h-80 rounded-lg border border-solid">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <DashboardIcon className="text-primary size-6" />
            </EmptyMedia>
            <EmptyTitle>{errorMessage ? "Your overview is unavailable" : "No invoices yet"}</EmptyTitle>
            <EmptyDescription>
              {errorMessage
                ? "Refresh to load your financial overview."
                : "Create an invoice to track collections, outstanding amounts, and your top clients."}
            </EmptyDescription>
          </EmptyHeader>
          {!errorMessage ? (
            <EmptyContent>
              <Button asChild>
                <Link href={LINKS.CREATE.INVOICE}>
                  Create your first invoice
                  <ArrowUpRight aria-hidden="true" />
                </Link>
              </Button>
            </EmptyContent>
          ) : null}
        </Empty>
      ) : (
        <>
          <DashboardOverview
            data={currency}
            controls={
              <div className="flex items-center gap-3">
                <span className="text-foreground/65 text-xs">
                  {currency.invoiceCount} {currency.invoiceCount === 1 ? "invoice" : "invoices"}
                </span>
                <label className="sr-only" htmlFor="dashboard-currency">
                  Currency
                </label>
                <Select value={currency.currency} onValueChange={onCurrencyChange}>
                  <SelectTrigger id="dashboard-currency" className="bg-background min-w-24 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="end">
                    <SelectGroup>
                      {dashboard.currencies.map((entry) => (
                        <SelectItem key={entry.currency} value={entry.currency}>
                          {entry.currency}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            }
          />

          <section aria-labelledby="monthly-trends-title" className="min-w-0">
            <Card className="bg-background gap-0 rounded-lg py-0 shadow-none">
              <CardHeader className="bg-muted/35 flex flex-row flex-wrap items-center justify-between gap-3 rounded-t-lg border-b px-5 py-3 [.border-b]:pb-3">
                <div className="flex items-center gap-2">
                  <CardTitle>
                    <h2 id="monthly-trends-title" className="text-sm font-medium">
                      Monthly trends
                    </h2>
                  </CardTitle>
                  <span className="text-foreground/65 text-xs">{currency.currency}</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-foreground/65 size-6"
                        aria-label="How monthly trends are calculated"
                      >
                        <CircleHelp className="size-3.5" aria-hidden="true" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      aria-label="About monthly trends"
                      align="start"
                      className="text-foreground/65 max-w-64 text-xs leading-relaxed"
                    >
                      Billed amounts follow the invoice date. Collected amounts follow the payment date. The period only
                      applies to this chart.
                    </PopoverContent>
                  </Popover>
                </div>
                <Select value={String(months)} onValueChange={(value) => onMonthsChange(value === "12" ? 12 : 6)}>
                  <SelectTrigger aria-label="Trend period" className="bg-background text-xs">
                    <CalendarDays className="size-3.5" aria-hidden="true" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="end">
                    <SelectGroup>
                      <SelectItem value="6">Last 6 months</SelectItem>
                      <SelectItem value="12">Last 12 months</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent className="p-4 sm:p-5">
                <MonthlyTrend data={currency} />
                {currency.undatedCollectedCount > 0 ? (
                  <p className="text-foreground/65 mt-3 border-t pt-3 text-xs leading-relaxed">
                    {currency.undatedCollectedCount} paid{" "}
                    {currency.undatedCollectedCount === 1 ? "invoice has" : "invoices have"} no payment date. Included
                    in collected totals, excluded from monthly collections.
                  </p>
                ) : null}
              </CardContent>
            </Card>
          </section>

          <TopClients data={currency} />

          <footer className="text-foreground/65 flex flex-wrap items-start justify-between gap-3 text-xs leading-relaxed">
            <div>
              <p>
                {signedIn
                  ? "Includes invoices on this device and in your account."
                  : "Showing invoices on this device. Sign in to include your saved invoices."}
              </p>
              <p>Amounts are reported separately for each currency.</p>
            </div>
            <Link
              className="text-foreground inline-flex items-center gap-1 underline-offset-4 hover:underline"
              href={LINKS.INVOICES}
            >
              View invoices
              <ArrowUpRight className="size-3" aria-hidden="true" />
            </Link>
          </footer>
        </>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div role="status" className="space-y-5">
      <span className="sr-only">Loading your financial overview…</span>
      <div className="overflow-hidden rounded-lg border" aria-hidden="true">
        <div className="bg-muted/25 border-b px-5 py-4 [.border-b]:pb-4">
          <Skeleton className="h-5 w-28" />
        </div>
        <div className="grid divide-y md:grid-cols-3 md:divide-x md:divide-y-0">
          {[0, 1, 2].map((index) => (
            <div key={index} className="space-y-3 p-5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-36" />
              <Skeleton className="h-3 w-40" />
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-6 rounded-lg border p-5" aria-hidden="true">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-60 w-full" />
      </div>
      <div className="space-y-4 rounded-lg border p-5" aria-hidden="true">
        <Skeleton className="h-5 w-24" />
        {[0, 1, 2].map((index) => (
          <Skeleton key={index} className="h-8 w-full" />
        ))}
      </div>
    </div>
  );
}

export { DashboardView };
