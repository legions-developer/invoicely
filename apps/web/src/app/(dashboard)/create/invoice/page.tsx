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
import { useIsMobile } from "@/hooks/use-mobile";
import React, { useEffect, useRef } from "react";
import { PdfWorkerProvider } from "@/providers";
import InvoicePreviewIsolated from "./invoice-preview-isolated";
import { useForm } from "react-hook-form";
import InvoiceForm from "./invoice-form";
import { cn } from "@/lib/utils";
import { useAtom } from "jotai";
import { debounce } from "lodash";

const Page = () => {
  console.log('Page component rendering', Date.now());
  
  const invoiceFormPanelRef = useRef<ImperativePanelHandle>(null);
  const invoicePreviewPanelRef = useRef<ImperativePanelHandle>(null);
  
  const [invoiceTab, setInvoiceTab] = useAtom(invoiceTabAtom);
  const isMobile = useIsMobile();
  
  const form = useForm<ZodCreateInvoiceSchema>({
    resolver: zodResolver(createInvoiceSchema),
    defaultValues: createInvoiceSchemaDefaultValues,
  });
  
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
        if (invoicePanel.isCollapsed()) {
          invoicePanel.expand();
        }
        if (invoicePreviewPanel.isCollapsed()) {
          invoicePreviewPanel.expand();
        }
        invoicePanel.resize(50);
        invoicePreviewPanel.resize(50);
        break;
    }
  }, [invoiceTab, isMobile, setInvoiceTab]);
  
  useEffect(() => {
    console.log('Setting up form subscription', Date.now());
    
    const debouncedUpdate = debounce(() => {
      console.log('Debounced update triggered', Date.now());
      
      const formData = form.getValues();
      
      if (window.updateInvoicePreview) {
        window.updateInvoicePreview(formData);
      }
    }, 1000);
    
    const subscription = form.watch((value, { name, type }) => {
      console.log(`Form watch triggered: ${name}, ${type}`, Date.now());
      
      if (!name || 
          name.includes("ui.") || 
          name.includes("metadata") || 
          name.includes("expanded") || 
          name.includes("collapsed") || 
          name.includes("accordion") || 
          name.includes("panel") || 
          type === "blur") {
        console.log(`Ignoring field change: ${name}`, Date.now());
        return;
      }
      
      console.log(`Processing field change: ${name}`, Date.now());
      debouncedUpdate();
    });
    
    debouncedUpdate();
    
    return () => {
      console.log('Cleaning up form subscription', Date.now());
      subscription.unsubscribe();
      debouncedUpdate.cancel();
    };
  }, [form]);
  
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
            <InvoicePreviewIsolated />
          </PdfWorkerProvider>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default Page;
