import { z } from "zod";

export const valueType = z.enum(["percentage", "fixed"], {
  errorMap: () => ({
    message: "Value type must be either 'percentage' or 'fixed'",
  }),
});

export const createInvoiceItemSchema = z.object(
  {
    name: z
      .string({ invalid_type_error: "Item name must be a string" })
      .min(1, { message: "Item name cannot be empty" }),
    description: z.string({
      invalid_type_error: "Item description must be a string",
    }),
    quantity: z.coerce
      .number({ invalid_type_error: "Quantity must be a number" })
      .positive({ message: "Quantity must be positive" }),
    unitPrice: z.coerce
      .number({ invalid_type_error: "Unit price must be a number" })
      .positive({ message: "Unit price must be positive" }),
  },
  { invalid_type_error: "Item must be an object" },
);

export const createInvoiceFieldKeyStringValuesSchema = z.object(
  {
    label: z.string({ invalid_type_error: "Label must be a string" }).min(1, {
      message: "Label cannot be empty",
    }),
    value: z.string({ invalid_type_error: "Value must be a string" }).min(1, {
      message: "Value cannot be empty",
    }),
  },
  { invalid_type_error: "Field key string values must be an object" },
);

export const createInvoiceFieldKeyNumberValuesSchema = z.object(
  {
    label: z.string({ invalid_type_error: "Label must be a string" }).min(1, {
      message: "Label cannot be empty",
    }),
    value: z.number({ invalid_type_error: "Value must be a number" }),
    type: valueType,
  },
  { invalid_type_error: "Field key number values must be an object" },
);

export const createInvoiceSchema = z.object({
  companyDetails: z.object(
    {
      logoBase64: z.string({ invalid_type_error: "Logo base64 must be a string" }).optional(),
      logo: z
        .string({ invalid_type_error: "Logo must be a string" })
        .refine(
          (val) =>
            !val ||
            val.startsWith("data:image") ||
            val.startsWith("blob:") ||
            val.startsWith("https://") ||
            val.startsWith("http://"),
          {
            message: "Logo must be a valid image URL, blob URL or data URL",
          },
        )
        .nullable()
        .optional(),
      signatureBase64: z.string({ invalid_type_error: "Signature base64 must be a string" }).optional(),
      signature: z
        .string({ invalid_type_error: "Signature must be a string" })
        .refine(
          (val) =>
            !val ||
            val.startsWith("data:image") ||
            val.startsWith("blob:") ||
            val.startsWith("https://") ||
            val.startsWith("http://"),
          {
            message: "Signature must be a valid image URL, blob URL or data URL",
          },
        )
        .nullable()
        .optional(),
      name: z.string({ invalid_type_error: "Company name must be a string" }).min(1, {
        message: "Company name cannot be empty",
      }),
      address: z.string({ invalid_type_error: "Address must be a string" }),
      metadata: z.array(createInvoiceFieldKeyStringValuesSchema),
    },
    { invalid_type_error: "Company details must be an object" },
  ),
  clientDetails: z.object(
    {
      name: z
        .string({ invalid_type_error: "Client name must be a string" })
        .min(1, { message: "Client name cannot be empty" }),
      address: z.string({ invalid_type_error: "Address must be a string" }),
      metadata: z.array(createInvoiceFieldKeyStringValuesSchema),
    },
    { invalid_type_error: "Client details must be an object" },
  ),
  invoiceDetails: z.object(
    {
      theme: z.object({
        baseColor: z.string({ invalid_type_error: "Base color must be a string" }).min(1, {
          message: "Base color cannot be empty",
        }),
        mode: z.enum(["dark", "light"], { invalid_type_error: "Mode must be either 'dark' or 'light'" }),
        template: z
          .enum(["default", "vercel"], {
            invalid_type_error: "Template must be either 'default' or 'vercel'",
          })
          .default("default")
          .optional(),
      }),
      currency: z
        .string({ invalid_type_error: "Currency must be a string" })
        .min(1, { message: "Currency cannot be empty" }),
      prefix: z.string({ invalid_type_error: "Prefix must be a string" }),
      serialNumber: z
        .string({ invalid_type_error: "Serial number must be a string" })
        .min(1, { message: "Serial number cannot be empty" }),
      date: z.date({ invalid_type_error: "Date must be a valid date" }),
      dueDate: z.date({ invalid_type_error: "Due date must be a valid date" }).optional().nullable(),
      paymentTerms: z.string({
        invalid_type_error: "Payment terms must be a string",
      }),
      billingDetails: z.array(createInvoiceFieldKeyNumberValuesSchema),
    },
    { invalid_type_error: "Invoice details must be an object" },
  ),
  items: z.array(createInvoiceItemSchema),
  metadata: z.object(
    {
      notes: z.string({ invalid_type_error: "Notes must be a string" }),
      terms: z.string({ invalid_type_error: "Terms must be a string" }),
      paymentInformation: z.array(createInvoiceFieldKeyStringValuesSchema),
    },
    { invalid_type_error: "Metadata must be an object" },
  ),
});

export type ZodCreateInvoiceSchema = z.infer<typeof createInvoiceSchema>;

export const createInvoiceSchemaDefaultValues: ZodCreateInvoiceSchema = {
  companyDetails: {
    name: "Invoicely Ltd.",
    address: "123 Main St, Anytown, USA",
    metadata: [],
  },
  clientDetails: {
    name: "John Doe",
    address: "456 Second St, Anytown, USA",
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
    date: new Date(), // now
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
