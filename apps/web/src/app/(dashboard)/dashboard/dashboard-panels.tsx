import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDashboardAmount, type DashboardCurrency } from "@/lib/dashboard/financial-dashboard";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CircleHelp } from "lucide-react";
import { type ReactNode } from "react";

interface DashboardPanelProps {
  data: DashboardCurrency;
}

function DashboardOverview({ data, controls }: DashboardPanelProps & { controls?: ReactNode }) {
  const metrics = [
    { title: "Collected", amount: data.collected, count: data.collectedCount, detail: "Paid invoices" },
    { title: "Outstanding", amount: data.outstanding, count: data.outstandingCount, detail: "All unpaid invoices" },
    { title: "Overdue", amount: data.overdue, count: data.overdueCount, detail: "Included in outstanding" },
  ];

  return (
    <section aria-labelledby="overview-title">
      <Card className="bg-background gap-0 overflow-hidden rounded-lg py-0 shadow-none">
        <CardHeader className="bg-muted/35 flex flex-row flex-wrap items-center justify-between gap-3 border-b px-5 py-3 [.border-b]:pb-3">
          <div className="flex items-center gap-2.5">
            <CardTitle>
              <h2 id="overview-title" className="text-sm font-medium">
                Overview
              </h2>
            </CardTitle>
            <span className="text-foreground/65 text-xs">All time</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-foreground/65 size-6"
                  aria-label="How overview totals are calculated"
                >
                  <CircleHelp className="size-3.5" aria-hidden="true" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                aria-label="About overview totals"
                align="start"
                className="text-foreground/65 max-w-72 text-xs leading-relaxed"
              >
                Collected includes paid invoices. Pending, error, and expired invoices are outstanding. Overdue invoices
                are past their due date or marked expired. Refunded invoices are excluded from amounts.
              </PopoverContent>
            </Popover>
          </div>
          {controls}
        </CardHeader>
        <CardContent className="px-0">
          <dl className="grid divide-y md:grid-cols-3 md:divide-x md:divide-y-0">
            {metrics.map(({ title, amount, count, detail }) => (
              <div key={title} className="min-w-0 px-5 py-5">
                <dt className="text-foreground/65 text-xs font-medium">{title}</dt>
                <dd className="mt-2 text-2xl font-semibold tracking-tight break-words tabular-nums">
                  {formatDashboardAmount(amount, data.currency)}
                </dd>
                <dd className="text-foreground/65 mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                  <span>
                    {count} {count === 1 ? "invoice" : "invoices"}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{detail}</span>
                </dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </section>
  );
}

function TopClients({ data }: DashboardPanelProps) {
  return (
    <section aria-labelledby="top-clients-title">
      <Card className="bg-background gap-0 overflow-hidden rounded-lg py-0 shadow-none">
        <CardHeader className="bg-muted/35 flex flex-row flex-wrap items-center justify-between gap-2 border-b px-5 py-4 [.border-b]:pb-4">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <CardTitle>
              <h2 id="top-clients-title" className="text-sm font-medium">
                Top clients
              </h2>
            </CardTitle>
            <p className="text-foreground/65 text-xs">Top 5 by billed amount</p>
          </div>
          <p className="text-foreground/65 text-xs">All time · {data.currency}</p>
        </CardHeader>
        <CardContent className="px-0">
          {data.topClients.length ? (
            <Table className="text-xs">
              <caption className="sr-only">Top clients in {data.currency}, ranked by all-time billed amount</caption>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead scope="col" className="text-foreground/65 h-9 pl-5">
                    Client
                  </TableHead>
                  <TableHead scope="col" className="text-foreground/65 h-9 px-4 text-right">
                    Invoices
                  </TableHead>
                  <TableHead scope="col" className="text-foreground/65 h-9 px-4 text-right">
                    Billed
                  </TableHead>
                  <TableHead scope="col" className="text-foreground/65 h-9 px-4 text-right">
                    Collected
                  </TableHead>
                  <TableHead scope="col" className="text-foreground/65 h-9 pr-5 pl-4 text-right">
                    Outstanding
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.topClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableHead scope="row" className="max-w-72 min-w-40 py-3 pr-4 pl-5 font-normal">
                      <p className="truncate text-sm font-medium" title={client.name}>
                        {client.name}
                      </p>
                      {client.address ? (
                        <p className="text-foreground/65 mt-0.5 truncate text-xs" title={client.address}>
                          {client.address}
                        </p>
                      ) : null}
                    </TableHead>
                    <TableCell className="text-foreground/65 h-14 px-4 text-right tabular-nums">
                      {client.invoiceCount}
                    </TableCell>
                    <TableCell className="px-4 text-right font-medium tabular-nums">
                      {formatDashboardAmount(client.billed, data.currency)}
                    </TableCell>
                    <TableCell className="px-4 text-right tabular-nums">
                      {formatDashboardAmount(client.collected, data.currency)}
                    </TableCell>
                    <TableCell className="pr-5 pl-4 text-right tabular-nums">
                      {formatDashboardAmount(client.outstanding, data.currency)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Empty className="gap-2 py-8 md:p-8">
              <EmptyHeader>
                <EmptyTitle className="text-sm">No clients to rank</EmptyTitle>
                <EmptyDescription className="text-xs">
                  Refunded invoices are excluded from client totals.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

export { DashboardOverview, TopClients };
