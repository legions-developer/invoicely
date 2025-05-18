import { pgTable, text, timestamp, uuid, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { Numeric } from "../custom/decimal";

interface InvoiceTheme {
  baseColor: string;
  mode: "dark" | "light";
}

// Enums
export const invoiceStatusEnum = pgEnum("invoice_status", ["pending", "success", "error", "expired", "refunded"]);
export const invoiceTypeEnum = pgEnum("invoice_type", ["index_db", "postgres"]);
export const invoiceValueTypesEnum = pgEnum("invoice_value_types", ["fixed", "percentage"]);

// Tables
export const invoices = pgTable("invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: invoiceTypeEnum("type").notNull().default("postgres"),
  status: invoiceStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  paidAt: timestamp("paid_at"),
});

export const invoiceFields = pgTable("invoice_fields", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceId: uuid("invoice_id")
    .references(() => invoices.id)
    .notNull(),
});

export const invoiceCompanyDetails = pgTable("invoice_company_details", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  invoiceFieldId: uuid("invoice_field_id")
    .references(() => invoiceFields.id)
    .notNull(),
});

export const invoiceCompanyDetailsLabelAndValues = pgTable("invoice_company_details_label_and_values", {
  id: uuid("id").primaryKey().defaultRandom(),
  label: text("label").notNull(),
  value: text("value").notNull(),
  invoiceCompanyDetailsId: uuid("invoice_company_details_id")
    .references(() => invoiceCompanyDetails.id)
    .notNull(),
});
export const invoiceClientDetails = pgTable("invoice_client_details", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  invoiceFieldId: uuid("invoice_field_id")
    .references(() => invoiceFields.id)
    .notNull(),
});

export const invoiceClientDetailsLabelAndValues = pgTable("invoice_client_details_label_and_values", {
  id: uuid("id").primaryKey().defaultRandom(),
  label: text("label").notNull(),
  value: text("value").notNull(),
  invoiceClientDetailsId: uuid("invoice_client_details_id")
    .references(() => invoiceClientDetails.id)
    .notNull(),
});

export const invoiceDetails = pgTable("invoice_details", {
  id: uuid("id").primaryKey().defaultRandom(),
  theme: jsonb("theme").$type<InvoiceTheme>().notNull(),
  currency: text("currency").notNull(),
  prefix: text("prefix").notNull(),
  serialNumber: text("serial_number").notNull(),
  date: timestamp("date").notNull(),
  dueDate: timestamp("due_date").notNull(),
  paymentTerms: text("payment_terms"),
  invoiceFieldId: uuid("invoice_field_id")
    .references(() => invoiceFields.id)
    .notNull(),
});

export const invoiceDetailsBillingDetailsLabelAndValues = pgTable("invoice_details_billing_details_label_and_values", {
  id: uuid("id").primaryKey().defaultRandom(),
  label: text("label"),
  value: Numeric("value", { precision: 10, scale: 2 }).notNull(),
  invoiceDetailsId: uuid("invoice_details_id")
    .references(() => invoiceDetails.id)
    .notNull(),
});

export const invoiceItems = pgTable("invoice_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  quantity: Numeric("quantity", { precision: 10, scale: 2 }).notNull(),
  price: Numeric("price", { precision: 10, scale: 2 }).notNull(),
  invoiceFieldId: uuid("invoice_field_id")
    .references(() => invoiceFields.id)
    .notNull(),
});

export const invoiceMetadata = pgTable("invoice_metadata", {
  id: uuid("id").primaryKey().defaultRandom(),
  notes: text("notes").notNull(),
  terms: text("terms").notNull(),
  invoiceFieldId: uuid("invoice_field_id")
    .references(() => invoiceFields.id)
    .notNull(),
});

export const invoiceMetadataPaymentInformationLabelAndValues = pgTable(
  "invoice_metadata_payment_information_label_and_values",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    label: text("label"),
    value: text("value"),
    invoiceMetadataId: uuid("invoice_metadata_id")
      .references(() => invoiceMetadata.id)
      .notNull(),
  },
);
