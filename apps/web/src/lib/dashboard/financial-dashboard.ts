import Decimal from "decimal.js";

// Keep calculations independent of Decimal configuration used elsewhere in the app.
const Money = Decimal.clone({ precision: 64, rounding: Decimal.ROUND_HALF_UP });

type DashboardDate = Date | string;

/** The dashboard query and locally saved invoices both satisfy this minimal shape. */
export interface DashboardInvoice {
  id: string;
  type: "local" | "server";
  status: "pending" | "success" | "error" | "expired" | "refunded";
  paidAt?: DashboardDate | null;
  invoiceFields: {
    clientDetails: { name: string; address: string };
    invoiceDetails: {
      currency: string;
      date: DashboardDate;
      dueDate?: DashboardDate | null;
      billingDetails: { type: "fixed" | "percentage"; value: Decimal.Value }[];
    };
    items: { quantity: Decimal.Value; unitPrice: Decimal.Value }[];
  };
}

export interface DashboardMonth {
  month: string;
  billed: string;
  collected: string;
}

export interface DashboardClient {
  id: string;
  name: string;
  address: string;
  invoiceCount: number;
  billed: string;
  collected: string;
  outstanding: string;
}

export interface DashboardCurrency {
  currency: string;
  invoiceCount: number;
  collected: string;
  outstanding: string;
  overdue: string;
  collectedCount: number;
  outstandingCount: number;
  overdueCount: number;
  undatedCollectedCount: number;
  monthly: DashboardMonth[];
  topClients: DashboardClient[];
}

export interface FinancialDashboard {
  invoiceCount: number;
  currencies: DashboardCurrency[];
}

/** Prefer the server record when a locally cached copy has the same invoice ID. */
export function mergeDashboardInvoices(
  localInvoices: readonly DashboardInvoice[],
  serverInvoices: readonly DashboardInvoice[],
): DashboardInvoice[] {
  return Array.from(new Map([...localInvoices, ...serverInvoices].map((invoice) => [invoice.id, invoice])).values());
}

/** Same formula as the PDF: percentages apply to the subtotal, then round the invoice to two decimals. */
export function getDashboardInvoiceTotal(invoice: DashboardInvoice): string {
  const subtotal = invoice.invoiceFields.items.reduce(
    (sum, item) => sum.plus(new Money(item.quantity).times(item.unitPrice)),
    new Money(0),
  );

  return invoice.invoiceFields.invoiceDetails.billingDetails
    .reduce(
      (total, rate) => total.plus(rate.type === "percentage" ? subtotal.times(rate.value).dividedBy(100) : rate.value),
      subtotal,
    )
    .toDecimalPlaces(2)
    .toFixed();
}

function asDate(value: DashboardDate | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function dayStart(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function add(left: string, right: string): string {
  return new Money(left).plus(right).toFixed();
}

function clientKey(name: string, address: string): string {
  const normalize = (value: string) => value.trim().replace(/\s+/g, " ").toLowerCase();
  return JSON.stringify([normalize(name), normalize(address)]);
}

/**
 * Summaries and client rankings cover all time; only monthly trends use the window.
 * Pending, failed, and expired invoices remain outstanding. Overdue is a subset of
 * outstanding, based on a past calendar due date or explicit expired status.
 * Refunded invoices do not contribute to financial totals. Successful invoices
 * without a payment date count toward collected, but never an invented payment month.
 */
export function buildFinancialDashboard(
  invoices: readonly DashboardInvoice[],
  { now = new Date(), months = 6, topClientLimit = 5 }: { now?: Date; months?: 6 | 12; topClientLimit?: number } = {},
): FinancialDashboard {
  const monthKeys = Array.from({ length: months }, (_, index) =>
    monthKey(new Date(now.getFullYear(), now.getMonth() - months + index + 1, 1)),
  );
  const currencies = new Map<string, { summary: DashboardCurrency; clients: Map<string, DashboardClient> }>();
  const today = dayStart(now);

  for (const invoice of invoices) {
    const details = invoice.invoiceFields.invoiceDetails;
    const currency = details.currency.trim().toUpperCase();
    let group = currencies.get(currency);

    if (!group) {
      group = {
        summary: {
          currency,
          invoiceCount: 0,
          collected: "0",
          outstanding: "0",
          overdue: "0",
          collectedCount: 0,
          outstandingCount: 0,
          overdueCount: 0,
          undatedCollectedCount: 0,
          monthly: monthKeys.map((month) => ({ month, billed: "0", collected: "0" })),
          topClients: [],
        },
        clients: new Map(),
      };
      currencies.set(currency, group);
    }

    const { summary, clients } = group;
    summary.invoiceCount += 1;
    if (invoice.status === "refunded") continue;

    const amount = getDashboardInvoiceTotal(invoice);
    const paid = invoice.status === "success";
    const dueDate = asDate(details.dueDate);
    const overdue = !paid && (invoice.status === "expired" || (dueDate !== null && dayStart(dueDate) < today));

    if (paid) {
      summary.collected = add(summary.collected, amount);
      summary.collectedCount += 1;
      const paidAt = asDate(invoice.paidAt);
      if (paidAt) {
        const month = summary.monthly.find((entry) => entry.month === monthKey(paidAt));
        if (month) month.collected = add(month.collected, amount);
      } else {
        summary.undatedCollectedCount += 1;
      }
    } else {
      summary.outstanding = add(summary.outstanding, amount);
      summary.outstandingCount += 1;
    }

    if (overdue) {
      summary.overdue = add(summary.overdue, amount);
      summary.overdueCount += 1;
    }

    const invoiceDate = asDate(details.date);
    const month = invoiceDate ? summary.monthly.find((entry) => entry.month === monthKey(invoiceDate)) : undefined;
    if (month) month.billed = add(month.billed, amount);

    const { name, address } = invoice.invoiceFields.clientDetails;
    const id = clientKey(name, address);
    const client = clients.get(id) ?? {
      id,
      name: name.trim(),
      address: address.trim(),
      invoiceCount: 0,
      billed: "0",
      collected: "0",
      outstanding: "0",
    };
    client.invoiceCount += 1;
    client.billed = add(client.billed, amount);
    if (paid) client.collected = add(client.collected, amount);
    else client.outstanding = add(client.outstanding, amount);
    clients.set(id, client);
  }

  return {
    invoiceCount: invoices.length,
    currencies: Array.from(currencies.values())
      .map(({ summary, clients }) => ({
        ...summary,
        topClients: Array.from(clients.values())
          .sort(
            (left, right) =>
              new Money(right.billed).comparedTo(left.billed) ||
              left.name.localeCompare(right.name) ||
              left.address.localeCompare(right.address),
          )
          .slice(0, Math.max(0, topClientLimit)),
      }))
      .sort((left, right) => left.currency.localeCompare(right.currency)),
  };
}

/** Format exact decimal strings without converting money to a JavaScript number. */
export function formatDashboardAmount(amount: string, currency: string, locale = "en-US"): string {
  let formatter: Intl.NumberFormat;
  try {
    // Match the two-decimal invoice amounts displayed in the app and generated PDFs.
    formatter = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      currencyDisplay: "code",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } catch {
    // Existing invoices may contain a custom currency label instead of an ISO code.
    return `${currency} ${new Money(amount).toFixed(2)}`;
  }

  const decimals = formatter.resolvedOptions().maximumFractionDigits ?? 2;
  const rounded = new Money(amount).toDecimalPlaces(decimals);
  const [integer, fraction] = rounded.abs().toFixed(decimals).split(".");
  const wholeParts = formatter.formatToParts(BigInt(integer!));
  const groupedInteger = wholeParts
    .filter((part) => part.type === "integer" || part.type === "group")
    .map((part) => part.value)
    .join("");
  const template = formatter.formatToParts(BigInt(rounded.isNegative() && !rounded.isZero() ? -1 : 1));

  return template
    .map((part) => {
      if (part.type === "integer") return groupedInteger;
      if (part.type === "fraction") return fraction;
      return part.value;
    })
    .join("");
}
