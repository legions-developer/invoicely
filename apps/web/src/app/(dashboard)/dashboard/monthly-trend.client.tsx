"use client";

import { formatDashboardAmount, type DashboardCurrency } from "@/lib/dashboard/financial-dashboard";
import Decimal from "decimal.js";
import { useId } from "react";

function monthLabel(month: string, short = false) {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    month: short ? "short" : "long",
    year: short ? "2-digit" : "numeric",
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
  const chartId = useId();
  const values = data.monthly.flatMap((month) => [new Decimal(month.billed), new Decimal(month.collected)]);
  const maximum = Decimal.max(0, ...values);
  const minimum = Decimal.min(0, ...values);
  const range = maximum.minus(minimum);
  const hasActivity = !range.isZero();
  const scale = hasActivity ? range : new Decimal(1);
  const chartTop = 16;
  const chartHeight = 200;
  const chartLeft = 64;
  const plotWidth = 736;
  const step = plotWidth / data.monthly.length;
  const barWidth = Math.min(26, step * 0.28);

  function yPosition(value: Decimal) {
    // Only chart coordinates use JS numbers. Money stays in Decimal/string form.
    return chartTop + maximum.minus(value).div(scale).toNumber() * chartHeight;
  }

  const zeroY = hasActivity ? yPosition(new Decimal(0)) : chartTop + chartHeight;

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-5 text-xs">
        <span className="inline-flex items-center gap-2">
          <span className="bg-primary/40 size-2.5 rounded-sm" />
          Billed
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="size-2.5 rounded-sm bg-emerald-600 dark:bg-emerald-400" />
          Collected
        </span>
      </div>
      {!hasActivity ? (
        <div className="bg-muted/30 text-muted-foreground mb-4 rounded-md p-3 text-xs">
          No billed or collected amounts in this period.
        </div>
      ) : null}
      <div className="overflow-x-auto">
        <svg
          viewBox="0 0 816 264"
          className="w-full min-w-[540px]"
          role="img"
          aria-labelledby={`${chartId}-title`}
          aria-describedby={`${chartId}-description`}
        >
          <title id={`${chartId}-title`}>Monthly billed and collected amounts in {data.currency}</title>
          <desc id={`${chartId}-description`}>
            Comparison for the last {data.monthly.length} months. Exact amounts are available in the monthly figures
            table below.
          </desc>
          {[0, 0.5, 1].map((fraction) => {
            const amount = maximum.minus(scale.times(fraction));
            const y = chartTop + chartHeight * fraction;
            return (
              <g key={fraction}>
                <line x1={chartLeft} x2="808" y1={y} y2={y} className="stroke-border" strokeDasharray="3 4" />
                <text x="52" y={y + 4} textAnchor="end" className="fill-muted-foreground font-mono text-[10px]">
                  {hasActivity ? compactAmount(amount) : fraction === 1 ? "0" : ""}
                </text>
              </g>
            );
          })}
          <line x1={chartLeft} x2="808" y1={zeroY} y2={zeroY} className="stroke-border" />
          {data.monthly.map((month, index) => {
            const center = chartLeft + step * (index + 0.5);
            return (
              <g key={month.month}>
                {(["billed", "collected"] as const).map((key, seriesIndex) => {
                  const amount = new Decimal(month[key]);
                  const valueY = hasActivity ? yPosition(amount) : zeroY;
                  return (
                    <rect
                      key={key}
                      x={center + (seriesIndex === 0 ? -barWidth - 2 : 2)}
                      y={Math.min(zeroY, valueY)}
                      width={barWidth}
                      height={Math.abs(valueY - zeroY)}
                      rx="3"
                      className={key === "billed" ? "fill-primary/40" : "fill-emerald-600 dark:fill-emerald-400"}
                    >
                      <title>
                        {monthLabel(month.month)} — {key === "billed" ? "Billed" : "Collected"}:{" "}
                        {formatDashboardAmount(month[key], data.currency)}
                      </title>
                    </rect>
                  );
                })}
                <text x={center} y="246" textAnchor="middle" className="fill-muted-foreground text-[10px]">
                  {monthLabel(month.month, true)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <details className="mt-3 border-t pt-4">
        <summary className="focus-visible:ring-ring w-fit cursor-pointer rounded-sm text-xs font-medium outline-none focus-visible:ring-2">
          View monthly figures
        </summary>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs tabular-nums">
            <caption className="sr-only">Monthly figures in {data.currency}</caption>
            <thead className="text-muted-foreground">
              <tr>
                <th scope="col" className="py-2 font-medium">
                  Month
                </th>
                <th scope="col" className="px-3 py-2 text-right font-medium">
                  Billed
                </th>
                <th scope="col" className="py-2 text-right font-medium">
                  Collected
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.monthly.map((month) => (
                <tr key={month.month}>
                  <th scope="row" className="py-3 font-normal whitespace-nowrap">
                    {monthLabel(month.month)}
                  </th>
                  <td className="px-3 py-3 text-right whitespace-nowrap">
                    {formatDashboardAmount(month.billed, data.currency)}
                  </td>
                  <td className="py-3 text-right whitespace-nowrap">
                    {formatDashboardAmount(month.collected, data.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

export { MonthlyTrend };
