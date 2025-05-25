"use client";

import InvoiceFieldKeyStringValuesSection from "./invoiceHelpers/invoice-field-key-string-value-section";
import InvoiceFieldKeyNumberValuesSection from "./invoiceHelpers/invoice-field-key-number-value-section";
import { Accordion, AccordionItem, AccordionContent, AccordionTrigger } from "@/components/ui/accordion";
import SheetImageSelectorTrigger from "@/components/ui/image/sheet-image-selector-trigger";
import { InvoiceImageSelectorSheet } from "./invoiceHelpers/invoice-image-selector-sheet";
import { ZodCreateInvoiceSchema } from "@/zod-schemas/invoice/create-invoice";
import InvoiceItemsSection from "./invoiceHelpers/invoice-items-section";
import { FormColorPicker } from "@/components/ui/form/form-color-picker";
import { FormDatePicker } from "@/components/ui/form/form-date-picker";
import { FormTextarea } from "@/components/ui/form/form-textarea";
import { getAllImages } from "@/lib/indexdb-queries/getAllImages";
import { FormSelect } from "@/components/ui/form/form-select";
import { currenciesWithSymbols } from "@/constants/currency";
import { FormInput } from "@/components/ui/form/form-input";
import FormRow from "@/components/ui/form/form-row";
import { SelectItem } from "@/components/ui/select";
import { Form } from "@/components/ui/form/form";
import { useQuery } from "@tanstack/react-query";
import { UseFormReturn } from "react-hook-form";
import { useSession } from "@/lib/client-auth";
import { Badge } from "@/components/ui/badge";
import { useTRPC } from "@/trpc/client";
import React from "react";

interface InvoiceFormProps {
  form: UseFormReturn<ZodCreateInvoiceSchema>;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ form }) => {
  const trpc = useTRPC();
  const { data: session } = useSession();
  // fetching images from indexedDB
  const idbImages = useQuery({
    queryKey: ["idb-images"],
    queryFn: () => getAllImages(),
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
  // Fetching Server Images
  const serverImages = useQuery({
    ...trpc.cloudflare.listImages.queryOptions(),
    enabled: !!session?.user,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: false,
  });

  return (
    <div className="scroll-bar-hidden flex h-full flex-col overflow-y-scroll">
      <Form {...form}>
        <form className="space-y-8">
          <Accordion type="single" collapsible defaultValue="company-details" className="w-full divide-y border-b">
            {/* Company Details */}
            <AccordionItem value="company-details">
              <AccordionTrigger>Company Details</AccordionTrigger>
              <AccordionContent>
                <div className="flex w-full flex-row gap-4 md:flex-col [&>*]:flex-1 [@media(min-width:1200px)]:flex-row">
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
                <FormInput
                  name="companyDetails.name"
                  label="Company Name"
                  reactform={form}
                  placeholder="John Doe ltd."
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
