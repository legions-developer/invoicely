/* eslint-disable jsx-a11y/alt-text */
"use client";

import { ZodCreateInvoiceSchema } from "@/zod-schemas/invoice/create-invoice";
import { Document, Page, Text, View, Image, Font } from "@react-pdf/renderer";
import { getSubTotalValue, getTotalValue } from "@/constants/pdf-helpers";
import { resolveBodyFontFamily } from "@/lib/invoice/resolve-pdf-font";
import { GEIST_FONT, GEIST_MONO_FONT } from "@/constants/pdf-fonts";
import { formatCurrencyText } from "@/constants/currency";
import { createTw } from "react-pdf-tailwind";
import { toWords } from "number-to-words";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import React from "react";

// Register fonts
Font.register({
  family: "GeistMono",
  fonts: GEIST_MONO_FONT,
});

Font.register({
  family: "Geist",
  fonts: GEIST_FONT,
});

// Invoice PDF Document component
const VercelPdf: React.FC<{ data: ZodCreateInvoiceSchema }> = ({ data }) => {
  const subtotal = getSubTotalValue(data);
  const total = getTotalValue(data);

  // Built per-render so the body font follows the selected theme font and so a CJK
  // fallback is appended only when the invoice actually contains Chinese (issue #48).
  // Applied as an explicit fontFamily array on the Page below — react-pdf-tailwind only
  // keeps the first family from a class, which would drop the CJK fallback.
  const bodyFontFamily = resolveBodyFontFamily(data, "Geist");
  const tw = createTw({
    theme: {
      fontFamily: {
        default: bodyFontFamily,
        geistmono: ["GeistMono"],
      },
      extend: {
        colors: {
          background: "#0A0A0A",
          borderColor: "#1c1c1c",
        },
        fontSize: {
          "2xs": "0.625rem",
          "3xs": "0.5rem",
        },
      },
    },
  });

  return (
    <Document
      title={`Invoice-${data.invoiceDetails.prefix}${data.invoiceDetails.serialNumber}`}
      author={data.companyDetails.name}
      creator={data.companyDetails.name}
      producer="Invoicely"
    >
      <Page
        size="A4"
        style={{
          ...tw(cn("text-sm text-black bg-background border border-borderColor")),
          fontFamily: bodyFontFamily,
        }}
      >
        <View style={tw("flex flex-row border-b border-borderColor p-4")}>
          <Text style={tw(cn("font-medium text-[40px] leading-[40px] tracking-tighter text-neutral-100"))}>
            {data.invoiceDetails.prefix}
            <Text style={tw(cn("font-geistmono tracking-tighter text-neutral-100"))}>
              {data.invoiceDetails.serialNumber}
            </Text>
          </Text>
        </View>
        <View style={tw("flex flex-row justify-between border-b border-borderColor")}>
          {/* Invoice Details */}
          <View style={tw("flex flex-col gap-1 p-4 pr-8 border-r border-borderColor")}>
            <View style={tw("flex flex-row items-center gap-1")}>
              <Text style={tw("text-2xs min-w-[100px] text-neutral-700")}>Serial Number</Text>
              <Text style={tw("text-2xs font-normal text-neutral-300")}>{data.invoiceDetails.serialNumber}</Text>
            </View>
            <View style={tw("flex flex-row items-center gap-1")}>
              <Text style={tw("text-2xs min-w-[100px] text-neutral-700")}>Date</Text>
              <Text style={tw("text-2xs font-normal text-neutral-300")}>
                {format(data.invoiceDetails.date, "dd/MM/yyyy")}
              </Text>
            </View>
            {data.invoiceDetails.dueDate && (
              <View style={tw("flex flex-row items-center gap-1")}>
                <Text style={tw("text-2xs min-w-[100px] text-neutral-700")}>Due Date</Text>
                <Text style={tw("text-2xs font-normal text-neutral-300")}>
                  {format(data.invoiceDetails.dueDate, "dd/MM/yyyy")}
                </Text>
              </View>
            )}
            {data.invoiceDetails.paymentTerms && (
              <View style={tw("flex flex-row items-center gap-1")}>
                <Text style={tw("text-2xs min-w-[100px] text-neutral-700")}>Payment Terms</Text>
                <Text style={tw("text-2xs font-normal text-neutral-300")}>{data.invoiceDetails.paymentTerms}</Text>
              </View>
            )}
            <View style={tw("flex flex-row items-center gap-1")}>
              <Text style={tw("text-2xs min-w-[100px] text-neutral-700")}>Currency</Text>
              <Text style={tw("text-2xs font-normal text-neutral-300")}>{data.invoiceDetails.currency}</Text>
            </View>
          </View>
          {/* Invoice Logo */}
          {data.companyDetails.logo && (
            <View style={tw("flex items-center justify-center border-l border-borderColor")}>
              <Image
                style={{
                  aspectRatio: 1 / 1,
                  ...tw("w-32 h-32 object-contain object-right"),
                }}
                src={data.companyDetails.logo}
              />
            </View>
          )}
        </View>
        {/* Invoice billing details */}
        <View style={tw("flex flex-row w-full gap-2.5 border-b border-borderColor")}>
          <View style={tw(cn("flex flex-col gap-1.5 p-4 w-1/2"))}>
            <Text style={tw(cn("text-neutral-600"))}>Billed By</Text>
            <Text style={tw("text-sm text-neutral-100")}>{data.companyDetails.name}</Text>
            <Text style={tw("text-2xs font-normal text-neutral-400")}>{data.companyDetails.address}</Text>
            {data.companyDetails.metadata.map((metadata) => (
              <View key={metadata.label} style={tw("flex flex-row items-center gap-1")}>
                <Text style={tw("text-2xs text-neutral-600")}>{metadata.label}</Text>
                <Text style={tw("text-2xs font-normal text-neutral-400")}>{metadata.value}</Text>
              </View>
            ))}
          </View>
          <View style={tw(cn("flex flex-col gap-1.5 p-4 w-1/2 border-l border-borderColor"))}>
            <Text style={tw(cn("text-neutral-600"))}>Billed To</Text>
            <Text style={tw("text-sm text-neutral-100")}>{data.clientDetails.name}</Text>
            <Text style={tw("text-2xs font-normal text-neutral-400")}>{data.clientDetails.address}</Text>
            {data.clientDetails.metadata.map((metadata) => (
              <View key={metadata.label} style={tw("flex flex-row items-center gap-1")}>
                <Text style={tw("text-2xs leading-[10px] text-neutral-600")}>{metadata.label}</Text>
                <Text style={tw("text-2xs leading-[10px] font-normal text-neutral-400")}>{metadata.value}</Text>
              </View>
            ))}
          </View>
        </View>
        {/* Items Table */}
        <View style={tw("grow")}>
          <View
            style={[
              tw(cn("flex-row flex items-center px-4 py-2.5 text-sm text-neutral-100 border-b border-borderColor")),
            ]}
          >
            <Text style={tw("w-[60%]")}>Item</Text>
            <Text style={tw("w-[10%] text-center")}>Qty</Text>
            <Text style={tw("w-[15%] text-right")}>Price</Text>
            <Text style={tw("w-[15%] text-right")}>Total</Text>
          </View>
          <View style={tw("flex flex-col")}>
            {data.items.map((item, index) => (
              <View
                key={index}
                style={tw(
                  cn(
                    "flex-row px-4 py-3 text-2xs border-b border-borderColor",
                    index % 2 === 0 ? "bg-[#111111]" : "bg-background",
                  ),
                )}
              >
                <View style={tw("flex flex-col w-[60%]")}>
                  <Text style={tw("w-full text-xs leading-[12px] text-neutral-100")}>{item.name}</Text>
                  <Text style={tw("text-2xs leading-[10px] mt-1 font-normal text-neutral-700")}>
                    {item.description}
                  </Text>
                </View>
                <Text style={tw("w-[10%] text-center font-geistmono tracking-tighter text-neutral-100")}>
                  {item.quantity}
                </Text>
                <Text style={tw("w-[15%] text-right font-geistmono tracking-tighter text-neutral-100")}>
                  {formatCurrencyText(data.invoiceDetails.currency, item.unitPrice)}
                </Text>
                <Text style={tw("w-[15%] text-right font-geistmono tracking-tighter text-neutral-100")}>
                  {formatCurrencyText(data.invoiceDetails.currency, item.quantity * item.unitPrice)}
                </Text>
              </View>
            ))}
          </View>
        </View>
        {/* Invoice meta data and pricing */}
        <View style={tw("flex flex-row border-t border-borderColor")}>
          <View style={tw("flex flex-col w-1/2 border-r border-borderColor")}>
            {/* Payment Information */}
            {data.metadata.paymentInformation.length ? (
              <View style={tw("flex flex-col gap-0.5 pr-2.5 p-4")}>
                <Text style={tw(cn("text-white text-sm"))}>Payment Information</Text>
                <View style={tw("flex flex-col gap-0.5 mt-1.5")}>
                  {data.metadata.paymentInformation.map((paymentInformation, index) => {
                    return (
                      <View key={index} style={tw("flex flex-row items-center gap-1")}>
                        <Text style={tw("text-2xs min-w-[100px] text-neutral-600")}>{paymentInformation.label}</Text>
                        <Text style={tw("text-2xs font-normal text-neutral-400")}>{paymentInformation.value}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            ) : null}
            {/* Terms and conditions */}
            {data.metadata.terms && (
              <View style={tw("flex flex-col gap-0.5 p-4 border-t border-borderColor")}>
                <Text style={tw(cn("text-white text-sm"))}>Terms</Text>
                <Text style={tw("text-2xs font-normal text-neutral-500 mt-1")}>{data.metadata.terms}</Text>
              </View>
            )}
            {/* Notes */}
            {data.metadata.notes && (
              <View style={tw("flex flex-col gap-0.5 p-4 border-t border-borderColor")}>
                <Text style={tw(cn("text-white text-sm"))}>Notes</Text>
                <Text style={tw("text-2xs font-normal text-neutral-500 mt-1")}>{data.metadata.notes}</Text>
              </View>
            )}
          </View>
          {/* Pricing  */}
          <View style={tw("flex flex-col w-1/2")}>
            {/* Signature */}
            {data.companyDetails.signature && (
              <View style={tw("flex flex-col items-end border-b border-borderColor")}>
                <Image
                  style={{
                    aspectRatio: 1 / 1,
                    ...tw("h-24 w-24 object-cover border-l border-borderColor"),
                  }}
                  src={data.companyDetails.signature}
                />
              </View>
            )}
            <View style={tw("flex flex-col gap-1 p-4")}>
              <View style={tw("flex flex-row items-center justify-between")}>
                <Text style={tw("text-2xs text-neutral-500")}>Subtotal</Text>
                <Text style={tw("text-2xs font-geistmono tracking-tight text-neutral-400 leading-[10px]")}>
                  {formatCurrencyText(data.invoiceDetails.currency, subtotal)}
                </Text>
              </View>
              {/* Billing Details */}
              {data.invoiceDetails.billingDetails.map((billingDetail, index) => {
                if (billingDetail.type === "percentage") {
                  return (
                    <View key={index} style={tw("flex flex-row items-center justify-between")}>
                      <Text style={tw("text-2xs text-neutral-500")}>{billingDetail.label}</Text>
                      <Text style={tw("text-2xs font-geistmono tracking-tight text-neutral-400 leading-[10px]")}>
                        {billingDetail.value} %
                      </Text>
                    </View>
                  );
                }

                return (
                  <View key={index} style={tw("flex flex-row items-center justify-between")}>
                    <Text style={tw("text-2xs text-neutral-500")}>{billingDetail.label}</Text>
                    <Text style={tw("text-2xs font-geistmono tracking-tight text-neutral-400 leading-[10px]")}>
                      {formatCurrencyText(data.invoiceDetails.currency, billingDetail.value)}
                    </Text>
                  </View>
                );
              })}
            </View>
            <View style={tw("flex flex-row items-center justify-between border-t border-borderColor p-4")}>
              <Text style={tw("text-xs text-neutral-500")}>Total</Text>
              <Text style={tw("text-lg leading-[16px] font-geistmono tracking-tight text-white")}>
                {formatCurrencyText(data.invoiceDetails.currency, total)}
              </Text>
            </View>
            <View style={tw("flex flex-col gap-0.5 p-4 border-t border-borderColor")}>
              <Text style={tw("text-3xs font-normal text-neutral-500")}>Invoice Total (in words)</Text>
              <Text style={tw("text-2xs font-normal text-neutral-300")}>{toWords(total)}</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default VercelPdf;
