/* eslint-disable jsx-a11y/alt-text */
"use client";

import { GEIST_MONO_FONT, JETBRAINS_MONO_FONT, QUICKSAND_FONT } from "@/constants/pdf-fonts";
import { ZodCreateInvoiceSchema } from "@/zod-schemas/invoice/create-invoice";
import { Document, Page, Text, View, Image, Font } from "@react-pdf/renderer";
import { getSubTotalValue, getTotalValue } from "@/constants/pdf-helpers";
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
  family: "Quicksand",
  fonts: QUICKSAND_FONT,
});

Font.register({
  family: "JetBrainsMono",
  fonts: JETBRAINS_MONO_FONT,
});

const tw = createTw({
  theme: {
    fontFamily: {
      default: ["Quicksand"],
      geistmono: ["GeistMono"],
      jetbrainsmono: ["JetBrainsMono"],
    },
    extend: {
      colors: {
        darkmode: "#181818",
      },
      fontSize: {
        "2xs": "0.625rem",
        "3xs": "0.5rem",
      },
    },
  },
});

// Invoice PDF Document component
const DefaultPDF: React.FC<{ data: ZodCreateInvoiceSchema }> = ({ data }) => {
  const darkMode = data.invoiceDetails.theme.mode === "dark";
  // Calculate totals
  const subtotal = getSubTotalValue(data);
  const total = getTotalValue(data);

  return (
    <Document
      title={`Invoice-${data.invoiceDetails.prefix}${data.invoiceDetails.serialNumber}`}
      author={data.companyDetails.name}
      creator={data.companyDetails.name}
      producer="Invoicely"
    >
      <Page
        size="A4"
        style={tw(cn("p-6 font-default text-sm", darkMode ? "text-white bg-darkmode" : "text-black bg-white"))}
      >
        <View style={tw("flex flex-row")}>
          <View style={tw("text-2xl font-semibold font-geistmono tracking-tighter")}>
            <Text
              style={tw(
                cn(
                  "font-semibold font-jetbrainsmono tracking-tighter",
                  darkMode ? "text-white" : `text-[${data.invoiceDetails.theme.baseColor}]`,
                ),
              )}
            >
              Invoice {data.invoiceDetails.prefix}
              {data.invoiceDetails.serialNumber}
            </Text>
          </View>
        </View>
        <View style={tw("flex flex-row justify-between mt-2")}>
          {/* Invoice Details */}
          <View style={tw("flex flex-col gap-1")}>
            <View style={tw("flex flex-row items-center gap-1")}>
              <Text style={tw("text-2xs font-semibold min-w-[100px]")}>Serial Number</Text>
              <Text style={tw("text-2xs font-normal text-neutral-500")}>{data.invoiceDetails.serialNumber}</Text>
            </View>
            <View style={tw("flex flex-row items-center gap-1")}>
              <Text style={tw("text-2xs font-semibold min-w-[100px]")}>Date</Text>
              <Text style={tw("text-2xs font-normal text-neutral-500")}>
                {format(data.invoiceDetails.date, "dd/MM/yyyy")}
              </Text>
            </View>
            <View style={tw("flex flex-row items-center gap-1")}>
              <Text style={tw("text-2xs font-semibold min-w-[100px]")}>Due Date</Text>
              <Text style={tw("text-2xs font-normal text-neutral-500")}>
                {format(data.invoiceDetails.dueDate, "dd/MM/yyyy")}
              </Text>
            </View>
            <View style={tw("flex flex-row items-center gap-1")}>
              <Text style={tw("text-2xs font-semibold min-w-[100px]")}>Payment Terms</Text>
              <Text style={tw("text-2xs font-normal text-neutral-500")}>{data.invoiceDetails.paymentTerms}</Text>
            </View>
            <View style={tw("flex flex-row items-center gap-1")}>
              <Text style={tw("text-2xs font-semibold min-w-[100px]")}>Currency</Text>
              <Text style={tw("text-2xs font-normal text-neutral-500")}>{data.invoiceDetails.currency}</Text>
            </View>
          </View>
          {/* Invoice Logo */}
          {data.companyDetails.logo && (
            <View style={tw("flex items-center justify-center")}>
              <Image
                style={{
                  aspectRatio: 16 / 9,
                  ...tw("w-20 h-20 object-contain object-right"),
                }}
                src={data.companyDetails.logo}
              />
            </View>
          )}
        </View>
        {/* Invoice billing details */}
        <View style={tw("flex flex-row mt-[18px] w-full gap-2.5")}>
          <View
            style={tw(cn("flex flex-col gap-1.5 p-2.5 w-1/2 rounded", darkMode ? "bg-neutral-800" : "bg-neutral-100"))}
          >
            <Text
              style={tw(cn("font-semibold", darkMode ? "text-white" : `text-[${data.invoiceDetails.theme.baseColor}]`))}
            >
              Billed By
            </Text>
            <Text style={tw("text-2xs font-semibold")}>{data.companyDetails.name}</Text>
            <Text style={tw("text-2xs font-normal text-neutral-500")}>{data.companyDetails.address}</Text>
            {data.companyDetails.metadata.map((metadata) => (
              <View key={metadata.label} style={tw("flex flex-row items-center gap-1")}>
                <Text style={tw("text-2xs font-semibold")}>{metadata.label}</Text>
                <Text style={tw("text-2xs font-normal text-neutral-500")}>{metadata.value}</Text>
              </View>
            ))}
          </View>
          <View
            style={tw(cn("flex flex-col gap-1.5 p-2.5 w-1/2 rounded", darkMode ? "bg-neutral-800" : "bg-neutral-100"))}
          >
            <Text
              style={tw(cn("font-semibold", darkMode ? "text-white" : `text-[${data.invoiceDetails.theme.baseColor}]`))}
            >
              Billed To
            </Text>
            <Text style={tw("text-2xs font-semibold")}>{data.clientDetails.name}</Text>
            <Text style={tw("text-2xs font-normal text-neutral-500")}>{data.clientDetails.address}</Text>
            {data.clientDetails.metadata.map((metadata) => (
              <View key={metadata.label} style={tw("flex flex-row items-center gap-1")}>
                <Text style={tw("text-2xs font-semibold")}>{metadata.label}</Text>
                <Text style={tw("text-2xs font-normal text-neutral-500")}>{metadata.value}</Text>
              </View>
            ))}
          </View>
        </View>
        {/* Items Table */}
        <View style={tw("mt-5 grow")}>
          <View
            style={[
              tw(
                cn(
                  "flex-row flex items-center px-2.5 pt-2.5 pb-1.5 font-bold text-2xs rounded text-white",
                  darkMode ? "bg-neutral-700" : `bg-[${data.invoiceDetails.theme.baseColor}]`,
                ),
              ),
            ]}
          >
            <Text style={tw("w-[60%]")}>Item</Text>
            <Text style={tw("w-[10%] text-center")}>Qty</Text>
            <Text style={tw("w-[15%] text-right")}>Price</Text>
            <Text style={tw("w-[15%] text-right")}>Total</Text>
          </View>
          <View style={tw("flex flex-col mt-1")}>
            {data.items.map((item, index) => (
              <View
                key={index}
                style={tw(
                  cn(
                    "flex-row p-2 text-2xs rounded",
                    index % 2 === 0
                      ? darkMode
                        ? "bg-darkmode"
                        : "bg-white"
                      : darkMode
                        ? "bg-neutral-800"
                        : "bg-neutral-100",
                  ),
                )}
              >
                <View style={tw("flex flex-col w-[60%]")}>
                  <Text style={tw("w-full font-semibold")}>{item.name}</Text>
                  <Text style={tw("text-xs font-normal text-neutral-600")}>{item.description}</Text>
                </View>
                <Text style={tw("w-[10%] text-center font-geistmono tracking-tighter font-semibold")}>
                  {item.quantity}
                </Text>
                <Text style={tw("w-[15%] text-right font-geistmono tracking-tighter font-semibold")}>
                  {formatCurrencyText(data.invoiceDetails.currency, item.unitPrice)}
                </Text>
                <Text style={tw("w-[15%] text-right font-geistmono tracking-tighter font-semibold")}>
                  {formatCurrencyText(data.invoiceDetails.currency, item.quantity * item.unitPrice)}
                </Text>
              </View>
            ))}
          </View>
        </View>
        {/* Invoice meta data and pricing */}
        <View style={tw("flex flex-row gap-[50px]")}>
          <View style={tw("flex flex-col gap-[15px] justify-end w-1/2")}>
            {/* Payment Information */}
            {data.metadata.paymentInformation.length ? (
              <View style={tw("flex flex-col gap-0.5 pr-2.5")}>
                <Text
                  style={tw(
                    cn("font-semibold", darkMode ? "text-white" : `text-[${data.invoiceDetails.theme.baseColor}]`),
                  )}
                >
                  Payment Information
                </Text>
                <View style={tw("flex flex-col gap-0.5 mt-1")}>
                  {data.metadata.paymentInformation.map((paymentInformation, index) => {
                    return (
                      <View key={index} style={tw("flex flex-row items-center gap-1")}>
                        <Text style={tw("text-2xs font-semibold min-w-[100px]")}>{paymentInformation.label}</Text>
                        <Text style={tw("text-2xs font-normal text-neutral-500")}>{paymentInformation.value}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            ) : null}
            {/* Terms and conditions */}
            {data.metadata.terms && (
              <View style={tw("flex flex-col gap-0.5 pr-2.5")}>
                <Text
                  style={tw(
                    cn("font-semibold", darkMode ? "text-white" : `text-[${data.invoiceDetails.theme.baseColor}]`),
                  )}
                >
                  Terms
                </Text>
                <Text style={tw("text-2xs font-normal text-neutral-500 mt-1")}>{data.metadata.terms}</Text>
              </View>
            )}
            {/* Notes */}
            {data.metadata.notes && (
              <View style={tw("flex flex-col gap-0.5 pr-2.5")}>
                <Text
                  style={tw(
                    cn("font-semibold", darkMode ? "text-white" : `text-[${data.invoiceDetails.theme.baseColor}]`),
                  )}
                >
                  Notes
                </Text>
                <Text style={tw("text-2xs font-normal text-neutral-500 mt-1")}>{data.metadata.notes}</Text>
              </View>
            )}
          </View>
          {/* Pricing  */}
          <View style={tw("flex flex-col gap-1 p-2.5 w-1/2 min-w-[50%] justify-end")}>
            {/* Signature */}
            {data.companyDetails.signature && (
              <View style={tw("flex flex-col gap-1 mb-1.5 items-end w-full")}>
                <Text style={tw("text-3xs font-normal text-neutral-500")}>Verified by {data.companyDetails.name}</Text>
                <Image
                  style={{
                    aspectRatio: 1 / 1,
                    ...tw("h-20 w-20 rounded-lg object-cover"),
                  }}
                  src={data.companyDetails.signature}
                />
              </View>
            )}
            <View style={tw("flex flex-row items-center justify-between")}>
              <Text style={tw("text-2xs font-semibold")}>Subtotal</Text>
              <Text style={tw("text-2xs font-geistmono tracking-tight text-neutral-500")}>
                {formatCurrencyText(data.invoiceDetails.currency, subtotal)}
              </Text>
            </View>
            {/* Billing Details */}
            {data.invoiceDetails.billingDetails.map((billingDetail, index) => {
              if (billingDetail.type === "percentage") {
                return (
                  <View key={index} style={tw("flex flex-row items-center justify-between")}>
                    <Text style={tw("text-2xs font-semibold")}>{billingDetail.label}</Text>
                    <Text style={tw("text-2xs font-geistmono tracking-tight text-neutral-500")}>
                      {billingDetail.value} %
                    </Text>
                  </View>
                );
              }

              return (
                <View key={index} style={tw("flex flex-row items-center justify-between")}>
                  <Text style={tw("text-2xs font-semibold")}>{billingDetail.label}</Text>
                  <Text style={tw("text-2xs font-geistmono tracking-tight text-neutral-500")}>
                    {formatCurrencyText(data.invoiceDetails.currency, billingDetail.value)}
                  </Text>
                </View>
              );
            })}
            <View
              style={tw(cn("border-b mt-1.5 mb-1.5", darkMode ? "border-neutral-800" : "border-neutral-200"))}
            ></View>
            <View style={tw("flex flex-row items-center justify-between")}>
              <Text style={tw("text-xs font-semibold")}>Total</Text>
              <Text style={tw("text-lg font-semibold font-geistmono tracking-tight")}>
                {formatCurrencyText(data.invoiceDetails.currency, total)}
              </Text>
            </View>
            <View style={tw("flex flex-col gap-0.5 mt-1")}>
              <Text style={tw("text-3xs font-normal text-neutral-500")}>Invoice Total (in words)</Text>
              <Text style={tw("text-2xs font-normal")}>{toWords(total)}</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default DefaultPDF;
