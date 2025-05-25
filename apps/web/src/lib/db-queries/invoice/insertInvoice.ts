import { ZodCreateInvoiceSchema } from "@/zod-schemas/invoice/create-invoice";
import { ERROR_MESSAGES } from "@/constants/issues";
import { db, schema } from "@invoicely/db";
import { v4 as uuidv4 } from "uuid";
import Decimal from "decimal.js";

export const insertInvoiceQuery = async (invoice: ZodCreateInvoiceSchema, userId: string, id?: string) => {
  // Inserting invoice in db
  const [insertedInvoice] = await db
    .insert(schema.invoices)
    .values({
      id: id ?? uuidv4(),
      type: "server",
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: userId,
    })
    .returning({
      id: schema.invoices.id,
    });

  if (!insertedInvoice) {
    throw new Error(ERROR_MESSAGES.FAILED_TO_INSERT_DATA + "~ invoice record");
  }

  // Inserting invoice field in db
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
    throw new Error(ERROR_MESSAGES.FAILED_TO_INSERT_DATA + "~ invoice field record");
  }

  // Inserting company details in db
  const [insertedCompanyDetails] = await db
    .insert(schema.invoiceCompanyDetails)
    .values({
      id: uuidv4(),
      name: invoice.companyDetails.name,
      address: invoice.companyDetails.address,
      invoiceFieldId: insertedInvoiceField.id,
      logo: invoice.companyDetails.logo,
      signature: invoice.companyDetails.signature,
    })
    .returning({
      id: schema.invoiceCompanyDetails.id,
    });

  if (!insertedCompanyDetails) {
    throw new Error(ERROR_MESSAGES.FAILED_TO_INSERT_DATA + "~ company details record");
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
    .returning({
      id: schema.invoiceClientDetails.id,
    });

  if (!insertedClientDetails) {
    throw new Error(ERROR_MESSAGES.FAILED_TO_INSERT_DATA + "~ client details record");
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
    .returning({
      id: schema.invoiceDetails.id,
    });

  if (!insertedInvoiceDetails) {
    throw new Error(ERROR_MESSAGES.FAILED_TO_INSERT_DATA + "~ invoice details record");
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
    .returning({
      id: schema.invoiceMetadata.id,
    });

  if (!insertedInvoiceMetadata) {
    throw new Error(ERROR_MESSAGES.FAILED_TO_INSERT_DATA + "~ invoice metadata record");
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

  // after successfully inserting return the invoice id
  return insertedInvoice.id;
};
