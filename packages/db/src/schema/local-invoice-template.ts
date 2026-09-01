import { integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import type { InvoiceTemplateData } from "@invoicely/invoice-core";

export const localInvoiceTemplates = pgTable("local_invoice_templates", {
  name: text("name").primaryKey(),
  schemaVersion: integer("schema_version").notNull().default(1),
  nextSerialNumber: text("next_serial_number").notNull().default("0001"),
  data: jsonb("data").$type<InvoiceTemplateData>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
