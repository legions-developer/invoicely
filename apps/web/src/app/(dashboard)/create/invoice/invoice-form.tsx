"use client";

import InvoiceFieldKeyStringValuesSection from "./invoiceHelpers/invoice-field-key-string-value-section";
import InvoiceFieldKeyNumberValuesSection from "./invoiceHelpers/invoice-field-key-number-value-section";
import { Accordion, AccordionItem, AccordionContent, AccordionTrigger } from "@/components/ui/accordion";
import SheetImageSelectorTrigger from "@/components/ui/image/sheet-image-selector-trigger";
import { InvoiceImageSelectorSheet } from "./invoiceHelpers/invoice-image-selector-sheet";
import { ZodCreateInvoiceSchema } from "@/zod-schemas/invoice/create-invoice";
import { InvoiceTemplateSelector } from "./invoiceHelpers/invoice-templates";
import { FormColorPicker } from "@/components/ui/form/form-color-picker";
import InvoiceItemsSection from "./invoiceHelpers/invoice-items-section";
import { FormDatePicker } from "@/components/ui/form/form-date-picker";
import { getAllImages } from "@/lib/indexdb-queries/getAllImages";
import { FormTextarea } from "@/components/ui/form/form-textarea";
import { FormSelect } from "@/components/ui/form/form-select";
import { currenciesWithSymbols } from "@/constants/currency";
import { FormInput } from "@/components/ui/form/form-input";
import FormRow from "@/components/ui/form/form-row";
import { SelectItem } from "@/components/ui/select";
import { useResizeObserver } from "@mantine/hooks";
import { Form } from "@/components/ui/form/form";
import { useQuery } from "@tanstack/react-query";
import { UseFormReturn } from "react-hook-form";
import { useSession } from "@/lib/client-auth";
import { Badge } from "@/components/ui/badge";
import { useTRPC } from "@/trpc/client";
import { cn } from "@/lib/utils";
import React from "react";

interface InvoiceFormProps {
  form: UseFormReturn<ZodCreateInvoiceSchema>;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ form }) => {
  const trpc = useTRPC();
  const [resizeRef, container] = useResizeObserver();

  const { data: session } = useSession();

  // fetching images from indexedDB
  const idbImages = useQuery({
    queryKey: ["idb-images"],
    queryFn: () => getAllImages(),
  });
  // Fetching Server Images
  const serverImages = useQuery({
    ...trpc.cloudflare.listImages.queryOptions(),
    enabled: !!session?.user,
  });

  return (
    <div className="scroll-bar-hidden flex h-full flex-col overflow-y-scroll">
      <Form {...form}>
        <form>
          <div className="flex h-14 flex-row items-center justify-between border-b px-4">
            <span className="text-sm font-medium">Invoice Template</span>
            <div className="">
              <InvoiceTemplateSelector form={form} />
            </div>
          </div>
          <Accordion type="single" collapsible defaultValue="company-details" className="w-full divide-y border-b">
            {/* Company Details */}
            <AccordionItem value="company-details">
              <AccordionTrigger>Company Details</AccordionTrigger>
              <AccordionContent ref={resizeRef} className={cn(container.width > 1200 ? "flex-row gap-4" : "flex-col")}>
                <div className={cn(container.width > 1200 ? "w-fit" : "w-full [&>*]:w-full", "flex flex-row gap-4")}>
                  <InvoiceImageSelectorSheet
                    type="logo"
                    isLoading={idbImages.isLoading || serverImages.isLoading}
                    idbImages={idbImages.data || []}
                    serverImages={serverImages.data?.images || []}
                    user={session?.user}
                    onUrlChange={(url) => {
                      form.setValue("companyDetails.logo", url);
                    }}
                    onBase64Change={(base64) => {
                      form.setValue("companyDetails.logoBase64", base64);
                    }}
                  >
                    <SheetImageSelectorTrigger
                      type="logo"
                      previewUrl={form.watch("companyDetails.logo") ?? undefined}
                      onRemove={() => {
                        form.setValue("companyDetails.logo", "");
                        form.setValue("companyDetails.logoBase64", undefined);
                      }}
                      label="Company Logo"
                    />
                  </InvoiceImageSelectorSheet>
                  <InvoiceImageSelectorSheet
                    type="signature"
                    isLoading={idbImages.isLoading || serverImages.isLoading}
                    idbImages={idbImages.data || []}
                    serverImages={serverImages.data?.images || []}
                    user={session?.user}
                    onUrlChange={(url) => {
                      form.setValue("companyDetails.signature", url);
                    }}
                    onBase64Change={(base64) => {
                      form.setValue("companyDetails.signatureBase64", base64);
                    }}
                  >
                    <SheetImageSelectorTrigger
                      type="signature"
                      previewUrl={form.watch("companyDetails.signature") ?? undefined}
                      onRemove={() => {
                        form.setValue("companyDetails.signature", "");
                        form.setValue("companyDetails.signatureBase64", undefined);
                      }}
                      label="Company Signature"
                    />
                  </InvoiceImageSelectorSheet>
                </div>
                <div className="flex w-full flex-col gap-2">
                  <FormInput
                    name="companyDetails.name"
                    label="Company Name"
                    reactform={form}
                    placeholder="Invoicely Ltd"
                    description="Name of your company"
                  />
                  <FormTextarea
                    className="h-20"
                    name="companyDetails.address"
                    label="Company Address"
                    reactform={form}
                    placeholder="123 Business St, City, Country"
                  />
                  <InvoiceFieldKeyStringValuesSection
                    reactform={form}
                    name="companyDetails.metadata"
                    label="Company Fields"
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
            {/* Client Details */}
            <AccordionItem value="client-details">
              <AccordionTrigger>Client Details</AccordionTrigger>
              <AccordionContent>
                <FormInput name="clientDetails.name" label="Client Name" reactform={form} placeholder="John Doe" />
                <FormTextarea
                  className="h-20"
                  name="clientDetails.address"
                  label="Client Address"
                  reactform={form}
                  placeholder="456 Client St, City, Country"
                />
                <InvoiceFieldKeyStringValuesSection
                  reactform={form}
                  name="clientDetails.metadata"
                  label="Client Fields"
                />
              </AccordionContent>
            </AccordionItem>
            {/* Invoice Details */}
            <AccordionItem value="invoice-details">
              <AccordionTrigger>Invoice Details</AccordionTrigger>
              <AccordionContent>
                <FormRow>
                  <FormSelect
                    name="invoiceDetails.currency"
                    description="Currency code for the invoice"
                    defaultValue="USD"
                    label="Currency"
                    reactform={form}
                  >
                    {Object.entries(currenciesWithSymbols).map(([key, value]) => (
                      <SelectItem key={key} value={key}>
                        <span>{key}</span>
                        <Badge className="bg-primary/15 text-primary rounded" variant="default">
                          {value}
                        </Badge>
                      </SelectItem>
                    ))}
                  </FormSelect>
                  {form.watch("invoiceDetails.theme.template") !== "vercel" && (
                    <>
                      <FormSelect
                        name="invoiceDetails.theme.mode"
                        description="Dark mode for the invoice"
                        defaultValue="dark"
                        label="Dark Mode"
                        reactform={form}
                      >
                        <SelectItem value="dark">
                          <span>Dark</span>
                        </SelectItem>
                        <SelectItem value="light">
                          <span>Light</span>
                        </SelectItem>
                      </FormSelect>
                      <FormColorPicker
                        name="invoiceDetails.theme.baseColor"
                        label="Theme Color"
                        reactform={form}
                        description="Works in white mode only"
                      />
                    </>
                  )}
                </FormRow>
                <FormRow>
                  <FormInput
                    name="invoiceDetails.prefix"
                    label="Invoice Prefix"
                    reactform={form}
                    placeholder="INV-"
                    description="Prefix for invoice number"
                    isOptional={true}
                  />
                  <FormInput
                    name="invoiceDetails.serialNumber"
                    label="Serial Number"
                    reactform={form}
                    placeholder="0001"
                    description="Invoice serial number"
                  />
                </FormRow>
                <FormRow>
                  <FormDatePicker
                    name="invoiceDetails.date"
                    label="Invoice Date"
                    reactform={form}
                    description="Date when invoice is issued"
                  />
                  <FormDatePicker
                    name="invoiceDetails.dueDate"
                    label="Due Date"
                    reactform={form}
                    description="Date when payment is due"
                  />
                </FormRow>
                <FormInput
                  name="invoiceDetails.paymentTerms"
                  label="Payment Terms"
                  reactform={form}
                  placeholder="50% of total amount upfront"
                  description="Terms of payment"
                  isOptional={true}
                />
                <InvoiceFieldKeyNumberValuesSection
                  reactform={form}
                  name="invoiceDetails.billingDetails"
                  label="Billing Details"
                />
              </AccordionContent>
            </AccordionItem>
            {/* Invoice Items */}
            <AccordionItem value="invoice-items">
              <AccordionTrigger>Invoice Items</AccordionTrigger>
              <AccordionContent>
                <InvoiceItemsSection form={form} />
              </AccordionContent>
            </AccordionItem>
            {/* Additional Information */}
            <AccordionItem value="additional-info">
              <AccordionTrigger>Additional Information</AccordionTrigger>
              <AccordionContent>
                <FormTextarea
                  name="metadata.notes"
                  label="Notes"
                  reactform={form}
                  placeholder="Notes - any relevant information not already covered"
                  description="Additional notes for the invoice"
                  isOptional={true}
                />
                <FormTextarea
                  name="metadata.terms"
                  label="Terms"
                  reactform={form}
                  placeholder="Terms & Conditions - late fees, payment methods, delivery terms, etc."
                  description="Terms and conditions for the invoice"
                  isOptional={true}
                />
                <InvoiceFieldKeyStringValuesSection
                  reactform={form}
                  name="metadata.paymentInformation"
                  label="Payment Information"
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </form>
      </Form>
    </div>
  );
};

export default InvoiceForm;
