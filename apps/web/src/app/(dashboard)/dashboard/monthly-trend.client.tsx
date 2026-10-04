"use client";

import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDashboardAmount, type DashboardCurrency } from "@/lib/dashboard/financial-dashboard";
import { EvilComposedChart } from "@/components/evilcharts/charts/recharts-composed-chart";
import { type ChartConfig } from "@/components/evilcharts/ui/recharts-chart";
import { ChevronDown } from "lucide-react";
import { ReferenceLine } from "recharts";
import Decimal from "decimal.js";
import { useId } from "react";

const Money = Decimal.clone({ precision: 64, rounding: Decimal.ROUND_HALF_UP });

const chartConfig = {
  billed: {
    label: "Billed",
    colors: {
      light: ["color-mix(in oklch, var(--light-primary) 52%, var(--background))"],
      dark: ["color-mix(in oklch, var(--light-primary) 42%, var(--background))"],
    },
  },
  collected: {
    label: "Collected",
    colors: { light: ["var(--primary)"], dark: ["var(--light-primary)"] },
  },
} satisfies ChartConfig;

function monthLabel(month: string, short = false) {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    month: short ? "short" : "long",
    ...(short ? {} : { year: "numeric" as const }),
  }).format(new Date(year, monthNumber - 1, 1));
}

function compactAmount(value: Decimal) {
  for (const [divisor, suffix] of [
    ["1000000000000", "T"],
    ["1000000000", "B"],
    ["1000000", "M"],
    ["1000", "K"],
  ]) {
    if (value.abs().gte(divisor)) return `${value.div(divisor).toDecimalPlaces(1).toString()}${suffix}`;
  }
  return value.toDecimalPlaces(2).toString();
}

function MonthlyTrend({ data }: { data: DashboardCurrency }) {
  const descriptionId = useId();
  const values = data.monthly.flatMap((month) => [new Money(month.billed), new Money(month.collected)]);
  const magnitude = Money.max(1, ...values.map((value) => value.abs()));
  const hasActivity = values.some((value) => !value.isZero());
  const hasNegativeValues = values.some((value) => value.isNegative());
  const hasPositiveValues = values.some((value) => value.isPositive() && !value.isZero());

  // Recharts only receives normalized drawing coordinates. Exact source strings
  // stay untouched for totals, tooltips, and the accessible figures table.
  const chartData = data.monthly.map((month) => ({
    month: month.month,
    billed: new Money(month.billed).div(magnitude).toNumber(),
    collected: new Money(month.collected).div(magnitude).toNumber(),
  }));
  const periodTotals = {
    billed: data.monthly.reduce((total, month) => total.plus(month.billed), new Money(0)).toFixed(),
    collected: data.monthly.reduce((total, month) => total.plus(month.collected), new Money(0)).toFixed(),
  };

  return (
    <div className="min-w-0">
      <div className="mb-4 flex flex-wrap gap-x-6 gap-y-2">
        {(["billed", "collected"] as const).map((series) => (
          <div key={series} className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
            <div className="text-muted-foreground flex items-center gap-2 text-xs">
              {series === "billed" ? (
                <span className="bg-light-primary/60 size-2.5 rounded-[2px]" aria-hidden="true" />
              ) : (
                <span className="bg-primary h-0.5 w-3" aria-hidden="true" />
              )}
              {chartConfig[series].label}
              <span className="sr-only">in this period</span>
            </div>
            <p className="text-sm font-medium break-words tabular-nums">
              {formatDashboardAmount(periodTotals[series], data.currency)}
            </p>
          </div>
        ))}
      </div>
      <div
        className="relative"
        role="group"
        aria-label={`Monthly billed and collected amounts in ${data.currency}`}
        aria-describedby={descriptionId}
      >
        <p id={descriptionId} className="sr-only">
          Comparison for the last {data.monthly.length} months. Use the arrow keys to explore the chart, or open the
          monthly figures table below for exact amounts.
        </p>
        <EvilComposedChart
          data={chartData}
          config={chartConfig}
          xDataKey="month"
          animationType="none"
          className="[&_.recharts-surface:focus-visible]:outline-ring aspect-auto h-60 w-full flex-none [&_.recharts-surface:focus-visible]:outline-2 [&_.recharts-surface:focus-visible]:outline-offset-2"
          chartProps={{
            margin: { top: 8, right: 8, bottom: 0, left: 0 },
          }}
        >
          <EvilComposedChart.Grid stroke="var(--border)" strokeDasharray="3 4" />
          <EvilComposedChart.XAxis
            dataKey="month"
            tickFormatter={(month: string) => monthLabel(month, true)}
            tickMargin={12}
            minTickGap={20}
            height={34}
            tick={{ fontSize: 11 }}
          />
          <EvilComposedChart.YAxis
            width={52}
            tickCount={5}
            tickMargin={10}
            tick={{ fontSize: 10 }}
            tickFormatter={(value: number) => compactAmount(magnitude.times(value))}
            domain={hasActivity ? [hasNegativeValues ? "auto" : 0, hasPositiveValues ? "auto" : 0] : [0, 1]}
            ticks={hasActivity ? undefined : [0]}
          />
          {hasNegativeValues ? <ReferenceLine y={0} stroke="var(--muted-foreground)" strokeOpacity={0.45} /> : null}
          <EvilComposedChart.Tooltip
            isAnimationActive={false}
            content={({ active, label }) => {
              const month = active ? data.monthly.find((entry) => entry.month === String(label)) : undefined;
              if (!month) return null;

              return (
                <div
                  role="status"
                  aria-live="polite"
                  aria-atomic="true"
                  className="bg-popover text-popover-foreground grid min-w-52 gap-3 rounded-md border px-3 py-3 text-xs shadow-md"
                >
                  <p className="font-medium">{monthLabel(month.month)}</p>
                  <dl className="grid gap-2">
                    {(["billed", "collected"] as const).map((series) => (
                      <div key={series} className="flex items-center justify-between gap-5">
                        <dt className="text-muted-foreground flex items-center gap-2">
                          <span
                            className="size-2 rounded-[2px]"
                            style={{ background: `var(--color-${series}-0)` }}
                            aria-hidden="true"
                          />
                          {chartConfig[series].label}
                        </dt>
                        <dd className="font-medium tabular-nums">
                          {formatDashboardAmount(month[series], data.currency)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              );
            }}
          />
          <EvilComposedChart.Bar dataKey="billed" radius={2} barProps={{ maxBarSize: 32 }} />
          <EvilComposedChart.Line
            dataKey="collected"
            curveType="linear"
            strokeVariant="solid"
            lineProps={{ stroke: "var(--color-collected-0)" }}
          >
            <EvilComposedChart.ActiveDot variant="colored-border" />
          </EvilComposedChart.Line>
        </EvilComposedChart>
        {!hasActivity ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-12 pb-8">
            <p className="bg-background/95 text-muted-foreground rounded px-3 py-2 text-center text-xs">
              No billed or collected amounts in this period.
            </p>
          </div>
        ) : null}
      </div>
      <details className="group mt-4 border-t pt-3">
        <summary className="text-muted-foreground hover:text-foreground focus-visible:ring-ring flex w-fit cursor-pointer list-none items-center gap-1.5 rounded-sm text-xs outline-none focus-visible:ring-2 [&::-webkit-details-marker]:hidden">
          <ChevronDown className="size-3 group-open:rotate-180" aria-hidden="true" />
          Monthly figures
        </summary>
        <div className="mt-3">
          <Table className="tabular-nums">
            <TableCaption className="sr-only">Monthly figures in {data.currency}</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Month</TableHead>
                <TableHead scope="col" className="text-right">
                  Billed
                </TableHead>
                <TableHead scope="col" className="text-right">
                  Collected
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.monthly.map((month) => (
                <TableRow key={month.month}>
                  <TableHead scope="row">{monthLabel(month.month)}</TableHead>
                  <TableCell className="text-right">{formatDashboardAmount(month.billed, data.currency)}</TableCell>
                  <TableCell className="text-right">{formatDashboardAmount(month.collected, data.currency)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </details>
    </div>
  );
}

export { MonthlyTrend };
