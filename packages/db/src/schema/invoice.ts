import { pgTable, text, timestamp, uuid, pgEnum, jsonb, integer } from "drizzle-orm/pg-core";
import { Numeric } from "../custom/decimal";
import { relations } from "drizzle-orm";

interface InvoiceTheme {
  baseColor: string;
  mode: "dark" | "light";
}

// Enums
export const invoiceStatusEnum = pgEnum("invoice_status", ["pending", "success", "error", "expired", "refunded"]);
export const invoiceTypeEnum = pgEnum("invoice_type", ["index_db", "postgres"]);
export const invoiceValueTypesEnum = pgEnum("invoice_value_types", ["fixed", "percentage"]);

// export enum types
export type InvoiceStatusType = (typeof invoiceStatusEnum.enumValues)[number];
export type InvoiceTypeType = (typeof invoiceTypeEnum.enumValues)[number];
export type InvoiceValueTypesType = (typeof invoiceValueTypesEnum.enumValues)[number];

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
  logo: text("logo"),
  signature: text("signature"),
  invoiceFieldId: uuid("invoice_field_id")
    .references(() => invoiceFields.id)
    .notNull(),
});

export const invoiceCompanyDetailsMetadata = pgTable("invoice_company_details_metadata", {
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

export const invoiceClientDetailsMetadata = pgTable("invoice_client_details_metadata", {
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
  paymentTerms: text("payment_terms").notNull().default(""),
  invoiceFieldId: uuid("invoice_field_id")
    .references(() => invoiceFields.id)
    .notNull(),
});

export const invoiceDetailsBillingDetails = pgTable("invoice_details_billing_details", {
  id: uuid("id").primaryKey().defaultRandom(),
  label: text("label").notNull(),
  type: invoiceValueTypesEnum("type").notNull(),
  value: Numeric("value", { precision: 10, scale: 2 }).notNull(),
  invoiceDetailsId: uuid("invoice_details_id")
    .references(() => invoiceDetails.id)
    .notNull(),
});

export const invoiceItems = pgTable("invoice_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: Numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
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

export const invoiceMetadataPaymentInformation = pgTable("invoice_metadata_payment_information", {
  id: uuid("id").primaryKey().defaultRandom(),
  label: text("label").notNull(),
  value: text("value").notNull(),
  invoiceMetadataId: uuid("invoice_metadata_id")
    .references(() => invoiceMetadata.id)
    .notNull(),
});

// Relations
export const invoiceRelations = relations(invoices, ({ one }) => ({
  invoiceFields: one(invoiceFields, {
    fields: [invoices.id],
    references: [invoiceFields.invoiceId],
  }),
}));

export const invoiceFieldsRelations = relations(invoiceFields, ({ one, many }) => ({
  companyDetails: one(invoiceCompanyDetails, {
    fields: [invoiceFields.id],
    references: [invoiceCompanyDetails.invoiceFieldId],
  }),
  clientDetails: one(invoiceClientDetails, {
    fields: [invoiceFields.id],
    references: [invoiceClientDetails.invoiceFieldId],
  }),
  invoiceDetails: one(invoiceDetails, {
    fields: [invoiceFields.id],
    references: [invoiceDetails.invoiceFieldId],
  }),
  metadata: one(invoiceMetadata, {
    fields: [invoiceFields.id],
    references: [invoiceMetadata.invoiceFieldId],
  }),
  items: many(invoiceItems),
}));

export const invoiceCompanyDetailsRelations = relations(invoiceCompanyDetails, ({ many }) => ({
  metadata: many(invoiceCompanyDetailsMetadata),
}));

export const invoiceClientDetailsRelations = relations(invoiceClientDetails, ({ many }) => ({
  metadata: many(invoiceClientDetailsMetadata),
}));

export const invoiceDetailsRelations = relations(invoiceDetails, ({ many }) => ({
  billingDetails: many(invoiceDetailsBillingDetails),
}));

export const invoiceMetadataRelations = relations(invoiceMetadata, ({ many }) => ({
  paymentInformation: many(invoiceMetadataPaymentInformation),
}));

// Reverse Relations
export const invoiceCompanyDetailsMetadataRelations = relations(invoiceCompanyDetailsMetadata, ({ one }) => ({
  companyDetails: one(invoiceCompanyDetails, {
    fields: [invoiceCompanyDetailsMetadata.invoiceCompanyDetailsId],
    references: [invoiceCompanyDetails.id],
  }),
}));

export const invoiceClientDetailsMetadataRelations = relations(invoiceClientDetailsMetadata, ({ one }) => ({
  clientDetails: one(invoiceClientDetails, {
    fields: [invoiceClientDetailsMetadata.invoiceClientDetailsId],
    references: [invoiceClientDetails.id],
  }),
}));

export const invoiceDetailsBillingDetailsRelations = relations(invoiceDetailsBillingDetails, ({ one }) => ({
  invoiceDetails: one(invoiceDetails, {
    fields: [invoiceDetailsBillingDetails.invoiceDetailsId],
    references: [invoiceDetails.id],
  }),
}));

export const invoiceMetadataPaymentInformationRelations = relations(invoiceMetadataPaymentInformation, ({ one }) => ({
  metadata: one(invoiceMetadata, {
    fields: [invoiceMetadataPaymentInformation.invoiceMetadataId],
    references: [invoiceMetadata.id],
  }),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoiceField: one(invoiceFields, {
    fields: [invoiceItems.invoiceFieldId],
    references: [invoiceFields.id],
  }),
}));
