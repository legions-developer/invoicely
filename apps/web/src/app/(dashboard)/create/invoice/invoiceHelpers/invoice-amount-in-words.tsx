"use client";

import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form/form";
import { formatAmountInWords, getAmountInWordsSuffix } from "@/lib/invoice/amount-in-words";
import type { ZodCreateInvoiceSchema } from "@/zod-schemas/invoice/create-invoice";
import { useWatch, type UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";

export const InvoiceAmountInWords = ({ form }: { form: UseFormReturn<ZodCreateInvoiceSchema> }) => {
  const [currency, options] = useWatch({
    control: form.control,
    name: ["invoiceDetails.currency", "invoiceDetails.amountInWords"],
  });
  const fields = [
    {
      name: "prefix",
      label: "Amount Prefix",
      placeholder: "e.g. Total:",
      description: "Optional text before the amount.",
    },
    {
      name: "singularSuffix",
      label: "Singular Suffix",
      placeholder: getAmountInWordsSuffix(currency, 1),
      description: "Used when the rounded amount is one, including minus one.",
    },
    {
      name: "pluralSuffix",
      label: "Plural Suffix",
      placeholder: getAmountInWordsSuffix(currency, 85),
      description: "Used for all other amounts, including zero and decimals.",
    },
  ] as const;

  return (
    <>
      <p className="text-muted-foreground text-xs">
        Leave suffixes blank to use the selected currency and “Only”. Custom suffixes replace that entire ending.
      </p>
      {fields.map(({ name, label, placeholder, description }) => (
        <FormField
          key={name}
          control={form.control}
          name={`invoiceDetails.amountInWords.${name}`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{label}</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ""} placeholder={placeholder} />
              </FormControl>
              <FormDescription>{description}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      ))}
      <div className="text-muted-foreground flex flex-col gap-1 text-xs" aria-live="polite">
        <p>1: {formatAmountInWords(1, currency, options)}</p>
        <p>85: {formatAmountInWords(85, currency, options)}</p>
      </div>
    </>
  );
};
