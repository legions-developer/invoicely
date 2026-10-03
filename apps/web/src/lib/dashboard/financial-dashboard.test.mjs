import {
  buildFinancialDashboard,
  formatDashboardAmount,
  getDashboardInvoiceTotal,
  mergeDashboardInvoices,
} from "./financial-dashboard.ts";
import assert from "node:assert/strict";
import test from "node:test";

const now = new Date(2026, 9, 4, 12);

function invoice(
  id,
  {
    currency = "USD",
    status = "pending",
    amount = "100",
    paidAt = null,
    date = new Date(2026, 9, 1),
    dueDate = null,
    client = "Acme",
    address = "1 Main St",
    ...rest
  } = {},
) {
  return {
    id,
    type: "local",
    status,
    paidAt,
    invoiceFields: {
      clientDetails: { name: client, address },
      invoiceDetails: { currency, date, dueDate, billingDetails: [] },
      items: [{ quantity: 1, unitPrice: amount }],
    },
    ...rest,
  };
}

test("keeps currencies separate, includes failed payments as outstanding, and excludes refunds", () => {
  const result = buildFinancialDashboard(
    [
      invoice("paid", { status: "success", amount: "200", paidAt: now }),
      invoice("pending", { amount: "40" }),
      invoice("failed", { status: "error", amount: "10" }),
      invoice("refunded", { status: "refunded", amount: "900", dueDate: new Date(2026, 8, 1) }),
      invoice("eur", { currency: "EUR", amount: "15" }),
    ],
    { now },
  );

  assert.equal(result.invoiceCount, 5);
  assert.deepEqual(
    result.currencies.map(({ currency }) => currency),
    ["EUR", "USD"],
  );
  const [eur, usd] = result.currencies;
  assert.equal(eur.outstanding, "15");
  assert.equal(usd.collected, "200");
  assert.equal(usd.outstanding, "50");
  assert.equal(usd.overdue, "0");
  assert.equal(usd.collectedCount, 1);
  assert.equal(usd.outstandingCount, 2);
  assert.equal(usd.topClients[0].billed, "250");
  assert.equal(usd.monthly.at(-1).billed, "250");
});

test("uses decimal arithmetic and the PDF subtotal formula for taxes and discounts", () => {
  const record = invoice("decimal");
  record.invoiceFields.items = [
    { quantity: 3, unitPrice: "0.1" },
    { quantity: 1, unitPrice: "0.2" },
  ];
  record.invoiceFields.invoiceDetails.billingDetails = [
    { type: "percentage", value: "20" },
    { type: "percentage", value: "-10" },
    { type: "fixed", value: "-0.05" },
  ];
  assert.equal(getDashboardInvoiceTotal(record), "0.5");

  const result = buildFinancialDashboard(
    [invoice("large", { amount: "9007199254740993.01" }), invoice("small", { amount: "0.02" })],
    { now },
  );
  assert.equal(result.currencies[0].outstanding, "9007199254740993.03");
});

test("overdue starts the day after the due date, including explicit expiry without a due date", () => {
  const result = buildFinancialDashboard(
    [
      invoice("yesterday", { dueDate: new Date(2026, 9, 3, 23, 59), amount: "10" }),
      invoice("today", { dueDate: new Date(2026, 9, 4), amount: "20" }),
      invoice("tomorrow", { dueDate: new Date(2026, 9, 5), amount: "30" }),
      invoice("no-due-date", { amount: "40" }),
      invoice("expired", { status: "expired", amount: "50" }),
      invoice("paid", { status: "success", amount: "60", dueDate: new Date(2026, 9, 1) }),
    ],
    { now },
  );
  assert.equal(result.currencies[0].overdue, "60");
  assert.equal(result.currencies[0].overdueCount, 2);
  assert.equal(result.currencies[0].outstanding, "150");
});

test("bills by invoice month and collects by payment month, including payments on old invoices", () => {
  const result = buildFinancialDashboard(
    [
      invoice("older", { date: new Date(2025, 0, 1), status: "success", paidAt: new Date(2026, 8, 1), amount: "300" }),
      invoice("recent", { date: new Date(2026, 8, 1), status: "success", paidAt: new Date(2026, 9, 1), amount: "200" }),
      invoice("old-unpaid", { date: new Date(2024, 0, 1), amount: "500" }),
    ],
    { now },
  );
  const currency = result.currencies[0];
  assert.equal(currency.collected, "500");
  assert.equal(currency.outstanding, "500");
  assert.deepEqual(currency.monthly.slice(-2), [
    { month: "2026-09", billed: "200", collected: "300" },
    { month: "2026-10", billed: "0", collected: "200" },
  ]);
  assert.equal(currency.topClients[0].billed, "1000");
});

test("retains undated collections in totals and flags them without fabricating payment months", () => {
  const result = buildFinancialDashboard(
    [
      invoice("undated", { status: "success", amount: "150" }),
      invoice("invalid-date", { status: "success", amount: "20", paidAt: "invalid" }),
    ],
    { now },
  );
  const currency = result.currencies[0];
  assert.equal(currency.collected, "170");
  assert.equal(currency.undatedCollectedCount, 2);
  assert.ok(currency.monthly.every((month) => month.collected === "0"));
});

test("zero-fills a six or twelve month window across year boundaries", () => {
  const record = invoice("record");
  const { monthly } = buildFinancialDashboard([record], { now: new Date(2026, 0, 31), months: 6 }).currencies[0];
  assert.deepEqual(
    monthly.map(({ month }) => month),
    ["2025-08", "2025-09", "2025-10", "2025-11", "2025-12", "2026-01"],
  );
  assert.ok(monthly.every((month) => month.billed === "0" && month.collected === "0"));
  const year = buildFinancialDashboard([record], { now, months: 12 }).currencies[0].monthly;
  assert.equal(year.length, 12);
  assert.equal(year[0].month, "2025-11");
  assert.equal(year.at(-1).month, "2026-10");
});

test("merges invoice sources by ID, preferring the server record without changing inputs", () => {
  const local = [invoice("same", { amount: "50" }), invoice("local")];
  const server = [invoice("same", { type: "server", amount: "80", status: "success" })];
  const original = structuredClone({ local, server });
  const merged = mergeDashboardInvoices(local, server);
  assert.equal(merged.length, 2);
  assert.equal(merged[0], server[0]);
  assert.deepEqual({ local, server }, original);
  const result = buildFinancialDashboard(merged, { now });
  assert.equal(result.currencies[0].collected, "80");
  assert.equal(result.currencies[0].outstanding, "100");
});

test("ranks clients by billed amount with exact comparisons, merging normalized name and address", () => {
  const result = buildFinancialDashboard(
    [
      invoice("a", { client: "Acme", address: "1 Main St", amount: "20" }),
      invoice("b", { client: " acme ", address: "1  Main St", amount: "30" }),
      invoice("c", { client: "Acme", address: "2 Main St", amount: "40" }),
      invoice("d", { client: "Zebra", amount: "9007199254740993.02" }),
      invoice("e", { client: "Alpha", amount: "9007199254740993.01" }),
    ],
    { now, topClientLimit: 3 },
  );
  const clients = result.currencies[0].topClients;
  assert.deepEqual(
    clients.map(({ name }) => name),
    ["Zebra", "Alpha", "Acme"],
  );
  assert.equal(clients[2].billed, "50");
  assert.equal(clients[2].invoiceCount, 2);
});

test("breaks equal client totals alphabetically and separates client rankings by currency", () => {
  const result = buildFinancialDashboard(
    [
      invoice("b", { client: "Beta" }),
      invoice("a", { client: "Alpha" }),
      invoice("eur", { client: "Alpha", currency: "EUR", amount: "500" }),
    ],
    { now },
  );
  assert.deepEqual(
    result.currencies[1].topClients.map(({ name }) => name),
    ["Alpha", "Beta"],
  );
  assert.equal(result.currencies[1].topClients[0].billed, "100");
  assert.equal(result.currencies[0].topClients[0].billed, "500");
});

test("formats exact large values and negative amounts to the same precision as invoices", () => {
  const normalize = (value) => value.replace(/\s/g, " ");
  assert.equal(normalize(formatDashboardAmount("9007199254740993.03", "USD")), "USD 9,007,199,254,740,993.03");
  assert.equal(normalize(formatDashboardAmount("100.5", "JPY")), "JPY 100.50");
  assert.equal(normalize(formatDashboardAmount("10.1235", "KWD")), "KWD 10.12");
  assert.equal(normalize(formatDashboardAmount("-0.01", "USD")), "-USD 0.01");
  assert.equal(normalize(formatDashboardAmount("-0.001", "USD")), "USD 0.00");
  assert.equal(formatDashboardAmount("10.1", "custom"), "custom 10.10");
});

test("sums individually rounded invoice amounts so totals reconcile with the PDFs", () => {
  const invoices = [invoice("one", { amount: "0.05" }), invoice("two", { amount: "0.05" })];
  for (const record of invoices) {
    record.invoiceFields.invoiceDetails.billingDetails = [{ type: "percentage", value: "10" }];
  }
  assert.equal(getDashboardInvoiceTotal(invoices[0]), "0.06");
  const currency = buildFinancialDashboard(invoices, { now }).currencies[0];
  assert.equal(currency.outstanding, "0.12");
  assert.equal(currency.monthly.at(-1).billed, "0.12");
  assert.equal(currency.topClients[0].billed, "0.12");
});

test("returns no currency totals for an empty invoice list", () => {
  assert.deepEqual(buildFinancialDashboard([], { now }), { invoiceCount: 0, currencies: [] });
});
