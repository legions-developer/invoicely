import { formatDashboardAmount, type DashboardCurrency } from "@/lib/dashboard/financial-dashboard";
import { ArrowDownLeft, Clock3, CircleAlert } from "lucide-react";

interface DashboardPanelProps {
  data: DashboardCurrency;
}

function DashboardOverview({ data }: DashboardPanelProps) {
  const metrics = [
    {
      title: "Collected",
      amount: data.collected,
      count: data.collectedCount,
      detail: "Invoices marked as paid",
      icon: ArrowDownLeft,
      color: "text-emerald-700 dark:text-emerald-400",
      background: "bg-emerald-500/10",
    },
    {
      title: "Outstanding",
      amount: data.outstanding,
      count: data.outstandingCount,
      detail: "All unpaid invoices, including overdue",
      icon: Clock3,
      color: "text-foreground",
      background: "bg-muted",
    },
    {
      title: "Overdue",
      amount: data.overdue,
      count: data.overdueCount,
      detail: "Past due date or marked expired",
      icon: CircleAlert,
      color: "text-amber-700 dark:text-amber-400",
      background: "bg-amber-500/10",
    },
  ];

  return (
    <section aria-labelledby="overview-title">
      <div className="mb-3 flex items-center justify-between">
        <h2 id="overview-title" className="text-sm font-medium">
          All-time overview
        </h2>
        <span className="text-muted-foreground font-mono text-xs">{data.currency}</span>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {metrics.map(({ title, amount, count, detail, icon: Icon, color, background }) => (
          <div key={title} className="min-w-0 rounded-xl border p-5 md:p-6">
            <div className="mb-5 flex items-center justify-between gap-2">
              <h3 className="text-sm font-medium">{title}</h3>
              <span className={`rounded-md p-2 ${color} ${background}`}>
                <Icon className="size-4" aria-hidden="true" />
              </span>
            </div>
            <p className={`text-2xl font-semibold tracking-tight break-words tabular-nums lg:text-3xl ${color}`}>
              {formatDashboardAmount(amount, data.currency)}
            </p>
            <p className="text-muted-foreground mt-2 text-xs">
              {count} {count === 1 ? "invoice" : "invoices"}
            </p>
            <p className="text-muted-foreground mt-5 border-t pt-3 text-xs">{detail}</p>
          </div>
        ))}
      </div>
      <p className="text-muted-foreground mt-3 text-xs leading-relaxed">
        Pending, error, and expired invoices are outstanding. Overdue is included in outstanding. Refunded invoices are
        excluded from amounts.
      </p>
    </section>
  );
}

function TopClients({ data }: DashboardPanelProps) {
  return (
    <section className="overflow-hidden rounded-xl border" aria-labelledby="top-clients-title">
      <div className="flex flex-wrap items-center justify-between gap-3 p-5 md:p-6">
        <div>
          <h2 id="top-clients-title" className="text-base font-semibold">
            Top clients
          </h2>
          <p className="text-muted-foreground mt-1 text-xs">
            Top 5 by all-time billed amount in {data.currency}. Matched by name and address.
          </p>
        </div>
        <span className="bg-muted rounded-md px-2 py-1 text-xs">All time</span>
      </div>
      {data.topClients.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-sm">
            <caption className="sr-only">Top clients in {data.currency}, ranked by total billed</caption>
            <thead className="text-muted-foreground bg-muted/40 border-y text-xs">
              <tr>
                <th scope="col" className="px-6 py-3 font-medium">
                  Client
                </th>
                <th scope="col" className="px-4 py-3 text-right font-medium">
                  Invoices
                </th>
                <th scope="col" className="px-4 py-3 text-right font-medium">
                  Billed
                </th>
                <th scope="col" className="px-4 py-3 text-right font-medium">
                  Collected
                </th>
                <th scope="col" className="px-6 py-3 text-right font-medium">
                  Outstanding
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.topClients.map((client, index) => (
                <tr key={client.id}>
                  <th scope="row" className="max-w-80 px-6 py-4 font-normal">
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground font-mono text-xs">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium break-words">{client.name}</p>
                        {client.address ? (
                          <p className="text-muted-foreground mt-1 truncate text-xs" title={client.address}>
                            {client.address}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </th>
                  <td className="text-muted-foreground px-4 py-4 text-right tabular-nums">{client.invoiceCount}</td>
                  <td className="px-4 py-4 text-right font-medium whitespace-nowrap tabular-nums">
                    {formatDashboardAmount(client.billed, data.currency)}
                  </td>
                  <td className="px-4 py-4 text-right whitespace-nowrap text-emerald-700 tabular-nums dark:text-emerald-400">
                    {formatDashboardAmount(client.collected, data.currency)}
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap tabular-nums">
                    {formatDashboardAmount(client.outstanding, data.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-muted-foreground px-6 pb-6 text-sm">
          No non-refunded invoices to rank in this currency yet.
        </p>
      )}
    </section>
  );
}

export { DashboardOverview, TopClients };
