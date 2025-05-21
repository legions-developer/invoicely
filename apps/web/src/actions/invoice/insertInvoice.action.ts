"use server";

import { createInvoiceSchema, ZodCreateInvoiceSchema } from "@/zod-schemas/invoice/create-invoice";
import { db, schema } from "@invoicely/db";
import { serverAuth } from "@/lib/auth";
import { headers } from "next/headers";
import { v4 as uuidv4 } from "uuid";
import Decimal from "decimal.js";
interface SuccessResponse {
  success: true;
  message: string;
}

interface ErrorResponse {
  success: false;
  message: string;
}

export const insertInvoice = async (invoice: ZodCreateInvoiceSchema): Promise<SuccessResponse | ErrorResponse> => {
  // Getting Session
  const session = await serverAuth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return {
      success: false,
      message: "User not found",
    };
  }

  const user = session.user;

  // If user have allowed saving data in db then save data to db
  if (!user.allowedSavingData) {
    return {
      success: false,
      message: "User not allowed to save data in db",
    };
  }

  //  safe parse invoiceData
  const invoiceData = createInvoiceSchema.safeParse(invoice);

  if (!invoiceData.success) {
    return {
      success: false,
      message: "Invoice data is invalid",
    };
  }

  try {
    // Inserting invoice in db
    const [insertedInvoice] = await db
      .insert(schema.invoices)
      .values({
        id: uuidv4(),
        type: "postgres",
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: user.id,
      })
      .returning({
        id: schema.invoices.id,
      });

    if (!insertedInvoice) {
      throw new Error("Error inserting invoice");
    }

    const [insertedInvoiceField] = await db
      .insert(schema.invoiceFields)
      .values({
        id: uuidv4(),
        invoiceId: insertedInvoice.id,
      })
      .returning({
        id: schema.invoiceFields.id,
      });

    if (!insertedInvoiceField) {
      throw new Error("Error inserting invoice field");
    }

    // Inserting company details in db
    const [insertedCompanyDetails] = await db
      .insert(schema.invoiceCompanyDetails)
      .values({
        id: uuidv4(),
        name: invoice.companyDetails.name,
        address: invoice.companyDetails.address,
        invoiceFieldId: insertedInvoiceField.id,
      })
      .returning({
        id: schema.invoiceCompanyDetails.id,
      });

    if (!insertedCompanyDetails) {
      throw new Error("Error inserting company details");
    }

    // Inserting company details metadata in db
    if (invoice.companyDetails.metadata.length > 0) {
      await db.insert(schema.invoiceCompanyDetailsMetadata).values(
        invoice.companyDetails.metadata.map((metadata) => ({
          id: uuidv4(),
          label: metadata.label,
          value: metadata.value,
          invoiceCompanyDetailsId: insertedCompanyDetails.id,
        })),
      );
    }

    // Inserting client details in db
    const [insertedClientDetails] = await db
      .insert(schema.invoiceClientDetails)
      .values({
        id: uuidv4(),
        name: invoice.clientDetails.name,
        address: invoice.clientDetails.address,
        invoiceFieldId: insertedInvoiceField.id,
      })
      .returning();

    if (!insertedClientDetails) {
      throw new Error("Error inserting client details");
    }

    // Inserting client details metadata in db
    if (invoice.clientDetails.metadata.length > 0) {
      await db.insert(schema.invoiceClientDetailsMetadata).values(
        invoice.clientDetails.metadata.map((metadata) => ({
          id: uuidv4(),
          label: metadata.label,
          value: metadata.value,
          invoiceClientDetailsId: insertedClientDetails.id,
        })),
      );
    }

    // Inserting invoice details in db
    const [insertedInvoiceDetails] = await db
      .insert(schema.invoiceDetails)
      .values({
        id: uuidv4(),
        currency: invoice.invoiceDetails.currency,
        prefix: invoice.invoiceDetails.prefix,
        serialNumber: invoice.invoiceDetails.serialNumber,
        date: invoice.invoiceDetails.date,
        dueDate: invoice.invoiceDetails.dueDate,
        paymentTerms: invoice.invoiceDetails.paymentTerms,
        theme: invoice.invoiceDetails.theme,
        invoiceFieldId: insertedInvoiceField.id,
      })
      .returning();

    if (!insertedInvoiceDetails) {
      throw new Error("Error inserting invoice details");
    }

    // Inserting invoice billing information in db
    if (invoice.invoiceDetails.billingDetails.length > 0) {
      await db.insert(schema.invoiceDetailsBillingDetails).values(
        invoice.invoiceDetails.billingDetails.map((billingDetail) => ({
          id: uuidv4(),
          label: billingDetail.label,
          invoiceDetailsId: insertedInvoiceDetails.id,
          value: new Decimal(billingDetail.value),
          type: billingDetail.type,
        })),
      );
    }

    // Inserting invoice items in db
    if (invoice.items.length > 0) {
      await db.insert(schema.invoiceItems).values(
        invoice.items.map((item) => ({
          id: uuidv4(),
          description: item.description,
          name: item.name,
          quantity: item.quantity,
          unitPrice: new Decimal(item.unitPrice),
          invoiceFieldId: insertedInvoiceField.id,
        })),
      );
    }

    // Inserting invoice metadata in db
    const [insertedInvoiceMetadata] = await db
      .insert(schema.invoiceMetadata)
      .values({
        id: uuidv4(),
        notes: invoice.metadata.notes,
        terms: invoice.metadata.terms,
        invoiceFieldId: insertedInvoiceField.id,
      })
      .returning();

    if (!insertedInvoiceMetadata) {
      throw new Error("Error inserting invoice metadata");
    }

    // Inserting invoice metadata payment information in db
    if (invoice.metadata.paymentInformation.length > 0) {
      await db.insert(schema.invoiceMetadataPaymentInformation).values(
        invoice.metadata.paymentInformation.map((paymentInformation) => ({
          id: uuidv4(),
          label: paymentInformation.label,
          value: paymentInformation.value,
          invoiceMetadataId: insertedInvoiceMetadata.id,
        })),
      );
    }

    return {
      success: true,
      message: "Invoice saved successfully",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    console.log("message", error);
    return {
      success: false,
      message: message,
    };
  }
};
