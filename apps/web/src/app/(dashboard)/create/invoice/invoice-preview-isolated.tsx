"use client";

import { createInvoiceSchema, ZodCreateInvoiceSchema } from "@/zod-schemas/invoice/create-invoice";
import { createBlobUrl, revokeBlobUrl } from "@/lib/invoice/create-blob-url";
import { parseCatchError } from "@/lib/neverthrow/parseCatchError";
import { invoiceErrorAtom } from "@/global/atoms/invoice-atom";
import { useMounted, useResizeObserver } from "@mantine/hooks";
import { createPdfBlob } from "@/lib/invoice/create-pdf-blob";
import PDFLoading from "@/components/layout/pdf/pdf-loading";
import PDFError from "@/components/layout/pdf/pdf-error";
import React, { useEffect, useState, useMemo, useRef } from "react";
import { Document, Page } from "react-pdf";
import { useSetAtom } from "jotai";

const PDF_VIEWER_PADDING = 18;

let globalFormData = null;
let globalUpdateCounter = 0;
let globalPdfUrl = null;
let globalPdfError = null;
let globalContainerWidth = 600;
let isGeneratingPdf = false;

window.updateInvoicePreview = (formData) => {
  console.log('Manual update triggered', Date.now());
  
  if (isGeneratingPdf) {
    console.log('Already generating PDF, skipping update', Date.now());
    return;
  }
  
  if (globalFormData && JSON.stringify(globalFormData) === JSON.stringify(formData)) {
    console.log('Form data unchanged, skipping update', Date.now());
    return;
  }
  
  globalFormData = formData;
  globalUpdateCounter++;
  
  const isDataValid = createInvoiceSchema.safeParse(formData);
  
  if (!isDataValid.success) {
    console.log('Form data invalid', Date.now());
    return;
  }
  
  console.log('Form data valid, generating PDF', Date.now());
  isGeneratingPdf = true;
  
  createPdfBlob({ invoiceData: formData })
    .then(blob => {
      const newUrl = createBlobUrl({ blob });
      
      if (globalPdfUrl) {
        revokeBlobUrl({ url: globalPdfUrl });
      }
      
      globalPdfUrl = newUrl;
      globalPdfError = null;
      
      const previewContainer = document.getElementById('invoice-preview-container');
      if (previewContainer) {
        const pdfViewer = document.getElementById('pdf-viewer');
        if (pdfViewer) {
          const iframe = pdfViewer.querySelector('iframe');
          if (iframe) {
            iframe.src = newUrl;
          }
        } else {
          previewContainer.innerHTML = `
            <div id="pdf-viewer" class="flex h-full w-full items-center justify-center">
              <iframe src="${newUrl}" width="${globalContainerWidth}" height="100%" style="border: none;"></iframe>
            </div>
          `;
        }
      }
    })
    .catch(err => {
      console.error('Error generating PDF', err);
      globalPdfError = parseCatchError(err, "Failed to generate PDF content");
      
      const previewContainer = document.getElementById('invoice-preview-container');
      if (previewContainer) {
        previewContainer.innerHTML = `
          <div class="h-full w-full">
            <div class="flex h-full w-full flex-col items-center justify-center">
              <div class="text-destructive text-center">
                <p>Failed to generate PDF content</p>
                <p>${globalPdfError}</p>
              </div>
            </div>
          </div>
        `;
      }
    })
    .finally(() => {
      isGeneratingPdf = false;
    });
};

const InvoicePreviewIsolated = () => {
  console.log('InvoicePreviewIsolated rendering', Date.now());
  
  const isClient = useMounted();
  const [resizeRef, container] = useResizeObserver();
  const setInvoiceError = useSetAtom(invoiceErrorAtom);
  const renderCountRef = useRef(0);
  
  useEffect(() => {
    globalContainerWidth = container.width || 600;
  }, [container.width]);
  
  useEffect(() => {
    renderCountRef.current++;
    console.log(`InvoicePreviewIsolated mounted (render #${renderCountRef.current})`, Date.now());
    
    const accordionButtons = document.querySelectorAll('button[aria-expanded]');
    accordionButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    });
    
    return () => {
      console.log('InvoicePreviewIsolated unmounting', Date.now());
      
      if (globalPdfUrl) {
        revokeBlobUrl({ url: globalPdfUrl });
      }
    };
  }, []);
  
  const content = useMemo(() => {
    console.log('Rendering initial content', Date.now());
    
    return (
      <div className="h-full w-full">
        <PDFLoading />
      </div>
    );
  }, []);
  
  return (
    <div 
      ref={resizeRef} 
      id="invoice-preview-container"
      className="scroll-bar-hidden bg-sidebar h-full w-full overflow-y-auto"
    >
      {!isClient ? content : (
        <div className="h-full w-full">
          <PDFLoading />
        </div>
      )}
    </div>
  );
};

function arePropsEqual() {
  console.log('React.memo comparison for InvoicePreviewIsolated', Date.now());
  return true;
}

export default React.memo(InvoicePreviewIsolated, arePropsEqual);
