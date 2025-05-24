CREATE TYPE "public"."invoice_status" AS ENUM('pending', 'success', 'error', 'expired', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."invoice_type" AS ENUM('local', 'server');--> statement-breakpoint
CREATE TYPE "public"."invoice_value_types" AS ENUM('fixed', 'percentage');--> statement-breakpoint
CREATE TABLE "invoice_client_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"address" text NOT NULL,
	"invoice_field_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_client_details_metadata" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"label" text NOT NULL,
	"value" text NOT NULL,
	"invoice_client_details_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_company_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"address" text NOT NULL,
	"logo" text,
	"signature" text,
	"invoice_field_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_company_details_metadata" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"label" text NOT NULL,
	"value" text NOT NULL,
	"invoice_company_details_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"theme" jsonb NOT NULL,
	"currency" text NOT NULL,
	"prefix" text NOT NULL,
	"serial_number" text NOT NULL,
	"date" timestamp NOT NULL,
	"due_date" timestamp NOT NULL,
	"payment_terms" text DEFAULT '' NOT NULL,
	"invoice_field_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_details_billing_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"label" text NOT NULL,
	"type" "invoice_value_types" NOT NULL,
	"value" numeric(10, 2) NOT NULL,
	"invoice_details_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_fields" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"invoice_field_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_metadata" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"notes" text NOT NULL,
	"terms" text NOT NULL,
	"invoice_field_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_metadata_payment_information" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"label" text NOT NULL,
	"value" text NOT NULL,
	"invoice_metadata_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "invoice_type" DEFAULT 'server' NOT NULL,
	"status" "invoice_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"paid_at" timestamp,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "invoice_client_details" ADD CONSTRAINT "invoice_client_details_invoice_field_id_invoice_fields_id_fk" FOREIGN KEY ("invoice_field_id") REFERENCES "public"."invoice_fields"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_client_details_metadata" ADD CONSTRAINT "invoice_client_details_metadata_invoice_client_details_id_invoice_client_details_id_fk" FOREIGN KEY ("invoice_client_details_id") REFERENCES "public"."invoice_client_details"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_company_details" ADD CONSTRAINT "invoice_company_details_invoice_field_id_invoice_fields_id_fk" FOREIGN KEY ("invoice_field_id") REFERENCES "public"."invoice_fields"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_company_details_metadata" ADD CONSTRAINT "invoice_company_details_metadata_invoice_company_details_id_invoice_company_details_id_fk" FOREIGN KEY ("invoice_company_details_id") REFERENCES "public"."invoice_company_details"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_details" ADD CONSTRAINT "invoice_details_invoice_field_id_invoice_fields_id_fk" FOREIGN KEY ("invoice_field_id") REFERENCES "public"."invoice_fields"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_details_billing_details" ADD CONSTRAINT "invoice_details_billing_details_invoice_details_id_invoice_details_id_fk" FOREIGN KEY ("invoice_details_id") REFERENCES "public"."invoice_details"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_fields" ADD CONSTRAINT "invoice_fields_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_field_id_invoice_fields_id_fk" FOREIGN KEY ("invoice_field_id") REFERENCES "public"."invoice_fields"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_metadata" ADD CONSTRAINT "invoice_metadata_invoice_field_id_invoice_fields_id_fk" FOREIGN KEY ("invoice_field_id") REFERENCES "public"."invoice_fields"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_metadata_payment_information" ADD CONSTRAINT "invoice_metadata_payment_information_invoice_metadata_id_invoice_metadata_id_fk" FOREIGN KEY ("invoice_metadata_id") REFERENCES "public"."invoice_metadata"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;