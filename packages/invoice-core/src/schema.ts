import { z } from "zod";

const imageSourceSchema = z
  .string({ invalid_type_error: "Image source must be a string" })
  .refine(
    (value) =>
      !value ||
      value.startsWith("data:image") ||
      value.startsWith("blob:") ||
      value.startsWith("https://") ||
      value.startsWith("http://"),
    { message: "Image source must be a valid image URL, blob URL, or data URL" },
  )
  .nullable()
  .optional();

const invoiceDateInputSchema = z.preprocess(
  (value) => (typeof value === "string" ? new Date(value) : value),
  z.date({ invalid_type_error: "Date must be a valid date" }),
);

export const invoiceValueTypeSchema = z.enum(["percentage", "fixed"], {
  errorMap: () => ({ message: "Value type must be either 'percentage' or 'fixed'" }),
});

export const invoiceTemplateNameSchema = z.enum(["default", "vercel"]);
export const invoiceFontNameSchema = z.enum(["quicksand", "geist", "inter", "jetbrainsmono"]);
export const invoiceThemeModeSchema = z.enum(["dark", "light"]);

export const createInvoiceItemSchema = z
  .object(
    {
      name: z.string({ invalid_type_error: "Item name must be a string" }).min(1, {
        message: "Item name cannot be empty",
      }),
      description: z.string({ invalid_type_error: "Item description must be a string" }),
      quantity: z.coerce
        .number({ invalid_type_error: "Quantity must be a number" })
        .positive({ message: "Quantity must be positive" }),
      unitPrice: z.coerce
        .number({ invalid_type_error: "Unit price must be a number" })
        .positive({ message: "Unit price must be positive" }),
    },
    { invalid_type_error: "Item must be an object" },
  )
  .strict();

export const createInvoiceFieldKeyStringValuesSchema = z
  .object(
    {
      label: z.string({ invalid_type_error: "Label must be a string" }).min(1, {
        message: "Label cannot be empty",
      }),
      value: z.string({ invalid_type_error: "Value must be a string" }).min(1, {
        message: "Value cannot be empty",
      }),
    },
    { invalid_type_error: "Field key string values must be an object" },
  )
  .strict();

export const createInvoiceFieldKeyNumberValuesSchema = z
  .object(
    {
      label: z.string({ invalid_type_error: "Label must be a string" }).min(1, {
        message: "Label cannot be empty",
      }),
      value: z.number({ invalid_type_error: "Value must be a number" }),
      type: invoiceValueTypeSchema,
    },
    { invalid_type_error: "Field key number values must be an object" },
  )
  .strict();

export const invoiceCompanyDetailsSchema = z
  .object(
    {
      logoBase64: z.string({ invalid_type_error: "Logo base64 must be a string" }).optional(),
      logo: imageSourceSchema,
      signatureBase64: z.string({ invalid_type_error: "Signature base64 must be a string" }).optional(),
      signature: imageSourceSchema,
      name: z.string({ invalid_type_error: "Company name must be a string" }).min(1, {
        message: "Company name cannot be empty",
      }),
      address: z.string({ invalid_type_error: "Address must be a string" }),
      metadata: z.array(createInvoiceFieldKeyStringValuesSchema),
    },
    { invalid_type_error: "Company details must be an object" },
  )
  .strict();

export const invoiceClientDetailsSchema = z
  .object(
    {
      name: z.string({ invalid_type_error: "Client name must be a string" }).min(1, {
        message: "Client name cannot be empty",
      }),
      address: z.string({ invalid_type_error: "Address must be a string" }),
      metadata: z.array(createInvoiceFieldKeyStringValuesSchema),
    },
    { invalid_type_error: "Client details must be an object" },
  )
  .strict();

export const invoiceThemeSchema = z
  .object({
    baseColor: z.string({ invalid_type_error: "Base color must be a string" }).min(1, {
      message: "Base color cannot be empty",
    }),
    mode: invoiceThemeModeSchema,
    template: invoiceTemplateNameSchema.default("default").optional(),
    font: invoiceFontNameSchema.optional(),
  })
  .strict();

export const invoiceDetailsSchema = z
  .object(
    {
      theme: invoiceThemeSchema,
      currency: z.string({ invalid_type_error: "Currency must be a string" }).min(1, {
        message: "Currency cannot be empty",
      }),
      prefix: z.string({ invalid_type_error: "Prefix must be a string" }),
      serialNumber: z.string({ invalid_type_error: "Serial number must be a string" }).min(1, {
        message: "Serial number cannot be empty",
      }),
      date: z.date({ invalid_type_error: "Date must be a valid date" }),
      dueDate: z.date({ invalid_type_error: "Due date must be a valid date" }).optional().nullable(),
      paymentTerms: z.string({ invalid_type_error: "Payment terms must be a string" }),
      billingDetails: z.array(createInvoiceFieldKeyNumberValuesSchema),
    },
    { invalid_type_error: "Invoice details must be an object" },
  )
  .strict();

export const invoiceMetadataSchema = z
  .object(
    {
      notes: z.string({ invalid_type_error: "Notes must be a string" }),
      terms: z.string({ invalid_type_error: "Terms must be a string" }),
      paymentInformation: z.array(createInvoiceFieldKeyStringValuesSchema),
    },
    { invalid_type_error: "Metadata must be an object" },
  )
  .strict();

export const createInvoiceSchema = z
  .object({
    companyDetails: invoiceCompanyDetailsSchema,
    clientDetails: invoiceClientDetailsSchema,
    invoiceDetails: invoiceDetailsSchema,
    items: z.array(createInvoiceItemSchema),
    metadata: invoiceMetadataSchema,
  })
  .strict();

export const createInvoiceJsonSchema = createInvoiceSchema.extend({
  invoiceDetails: invoiceDetailsSchema.extend({
    date: invoiceDateInputSchema,
    dueDate: invoiceDateInputSchema.optional().nullable(),
  }),
});

export const invoiceTemplateDataSchema = z
  .object({
    companyDetails: invoiceCompanyDetailsSchema,
    invoiceDetails: invoiceDetailsSchema.omit({ serialNumber: true, date: true, dueDate: true }),
    metadata: invoiceMetadataSchema,
  })
  .strict();

export const namedInvoiceTemplateSchema = z
  .object({
    schemaVersion: z.literal(1),
    name: z
      .string()
      .min(1, "Template name cannot be empty")
      .max(64, "Template name cannot exceed 64 characters")
      .regex(/^[a-z0-9][a-z0-9-_]*$/i, "Template names may contain letters, numbers, hyphens, and underscores"),
    nextSerialNumber: z.string().regex(/^\d+$/, "Next serial number must contain only digits"),
    data: invoiceTemplateDataSchema,
  })
  .strict();

export const invoiceGenerationInputSchema = z
  .object({
    clientDetails: invoiceClientDetailsSchema,
    items: z.array(createInvoiceItemSchema).min(1, "At least one invoice item is required"),
    date: invoiceDateInputSchema,
    dueDate: invoiceDateInputSchema.optional().nullable(),
    serialNumber: z.string().regex(/^\d+$/, "Serial number must contain only digits").optional(),
    overrides: z
      .object({
        currency: z.string().min(1).optional(),
        paymentTerms: z.string().optional(),
        billingDetails: z.array(createInvoiceFieldKeyNumberValuesSchema).optional(),
        notes: z.string().optional(),
        terms: z.string().optional(),
        paymentInformation: z.array(createInvoiceFieldKeyStringValuesSchema).optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

export type ZodCreateInvoiceSchema = z.output<typeof createInvoiceSchema>;
export type CreateInvoiceInput = z.input<typeof createInvoiceSchema>;
export type InvoiceTemplateName = z.infer<typeof invoiceTemplateNameSchema>;
export type InvoiceFontName = z.infer<typeof invoiceFontNameSchema>;
export type InvoiceTheme = z.infer<typeof invoiceThemeSchema>;
export type InvoiceTemplateData = z.infer<typeof invoiceTemplateDataSchema>;
export type NamedInvoiceTemplate = z.infer<typeof namedInvoiceTemplateSchema>;
export type InvoiceGenerationInput = z.output<typeof invoiceGenerationInputSchema>;

export function createInvoiceDefaultValues(date = new Date()): ZodCreateInvoiceSchema {
  return {
    companyDetails: {
      name: "Example Studio",
      address: "100 Example Avenue, Sample City",
      metadata: [],
    },
    clientDetails: {
      name: "Sample Client",
      address: "200 Demo Street, Sample City",
      metadata: [],
    },
    invoiceDetails: {
      theme: {
        template: "default",
        baseColor: "#635CFF",
        mode: "light",
      },
      currency: "USD",
      prefix: "Invoice INV-",
      serialNumber: "0001",
      date,
      paymentTerms: "",
      billingDetails: [],
    },
    items: [],
    metadata: {
      notes: "",
      terms: "",
      paymentInformation: [],
    },
  };
}

export function createTemplateData(invoice: ZodCreateInvoiceSchema): InvoiceTemplateData {
  return invoiceTemplateDataSchema.parse({
    companyDetails: invoice.companyDetails,
    invoiceDetails: {
      theme: invoice.invoiceDetails.theme,
      currency: invoice.invoiceDetails.currency,
      prefix: invoice.invoiceDetails.prefix,
      paymentTerms: invoice.invoiceDetails.paymentTerms,
      billingDetails: invoice.invoiceDetails.billingDetails,
    },
    metadata: invoice.metadata,
  });
}

export function buildInvoiceFromTemplate(
  template: NamedInvoiceTemplate,
  input: InvoiceGenerationInput,
): ZodCreateInvoiceSchema {
  const parsedTemplate = namedInvoiceTemplateSchema.parse(template);
  const parsedInput = invoiceGenerationInputSchema.parse(input);
  const { overrides } = parsedInput;

  return createInvoiceSchema.parse({
    companyDetails: parsedTemplate.data.companyDetails,
    clientDetails: parsedInput.clientDetails,
    invoiceDetails: {
      ...parsedTemplate.data.invoiceDetails,
      currency: overrides?.currency ?? parsedTemplate.data.invoiceDetails.currency,
      paymentTerms: overrides?.paymentTerms ?? parsedTemplate.data.invoiceDetails.paymentTerms,
      billingDetails: overrides?.billingDetails ?? parsedTemplate.data.invoiceDetails.billingDetails,
      serialNumber: parsedInput.serialNumber ?? parsedTemplate.nextSerialNumber,
      date: parsedInput.date,
      dueDate: parsedInput.dueDate,
    },
    items: parsedInput.items,
    metadata: {
      ...parsedTemplate.data.metadata,
      notes: overrides?.notes ?? parsedTemplate.data.metadata.notes,
      terms: overrides?.terms ?? parsedTemplate.data.metadata.terms,
      paymentInformation: overrides?.paymentInformation ?? parsedTemplate.data.metadata.paymentInformation,
    },
  });
}
