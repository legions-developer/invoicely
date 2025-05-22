"use client";

import {
  createInvoiceSchema,
  createInvoiceSchemaDefaultValues,
  type ZodCreateInvoiceSchema,
} from "@/zod-schemas/invoice/create-invoice";
import { ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import InvoiceOptions from "./invoiceOptionHelpers/invoice-options";
import { ImperativePanelHandle } from "react-resizable-panels";
import { invoiceTabAtom } from "@/global/atoms/invoice-atom";
import { zodResolver } from "@hookform/resolvers/zod";
import { Invoice } from "@/types/common/invoice";
import { useIsMobile } from "@/hooks/use-mobile";
import React, { useEffect, useRef } from "react";
import { PdfWorkerProvider } from "@/providers";
import InvoicePreview from "./invoice-preview";
import { useForm } from "react-hook-form";
import InvoiceForm from "./invoice-form";
import { cn } from "@/lib/utils";
import { useAtom } from "jotai";

interface InvoicePageProps {
  defaultInvoice?: Invoice["invoiceFields"];
}

const InvoicePage = ({ defaultInvoice }: InvoicePageProps) => {
  const invoiceFormPanelRef = useRef<ImperativePanelHandle>(null);
  const invoicePreviewPanelRef = useRef<ImperativePanelHandle>(null);
  const [invoiceTab, setInvoiceTab] = useAtom(invoiceTabAtom);
  const isMobile = useIsMobile();

  // Form
  const form = useForm<ZodCreateInvoiceSchema>({
    resolver: zodResolver(createInvoiceSchema),
    defaultValues: defaultInvoice || createInvoiceSchemaDefaultValues,
  });

  // Collapse or expand the panels based on the invoiceTab value
  useEffect(() => {
    const invoicePanel = invoiceFormPanelRef.current;
    const invoicePreviewPanel = invoicePreviewPanelRef.current;

    if (!invoicePanel || !invoicePreviewPanel) return;

    if (isMobile && invoiceTab === "both") {
      setInvoiceTab("form");
      return;
    }

    switch (invoiceTab) {
      case "form":
        if (invoicePanel.isCollapsed()) {
          invoicePanel.expand();
        }
        invoicePreviewPanel.collapse();
        invoicePanel.resize(100);
        break;
      case "preview":
        if (invoicePreviewPanel.isCollapsed()) {
          invoicePreviewPanel.expand();
        }
        invoicePanel.collapse();
        invoicePreviewPanel.resize(100);
        break;
      case "both":
        // Ensure both panels are expanded
        if (invoicePanel.isCollapsed()) {
          invoicePanel.expand();
        }
        if (invoicePreviewPanel.isCollapsed()) {
          invoicePreviewPanel.expand();
        }
        // Explicitly set sizes for "both" view
        invoicePanel.resize(50);
        invoicePreviewPanel.resize(50);
        break;
    }
  }, [invoiceTab, isMobile, setInvoiceTab]);

  return (
    <div className="flex h-full flex-col">
      <InvoiceOptions form={form} />
      <ResizablePanelGroup direction="horizontal" className="divide-x">
        <ResizablePanel collapsible={true} defaultSize={50} ref={invoiceFormPanelRef}>
          <InvoiceForm form={form} />
        </ResizablePanel>
        <ResizablePanel
          className={cn(invoiceTab === "both" ? "hidden md:flex" : "flex")}
          collapsible={true}
          defaultSize={50}
          ref={invoicePreviewPanelRef}
        >
          <PdfWorkerProvider>
            <InvoicePreview form={form} />
          </PdfWorkerProvider>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default InvoicePage;
