"use client";

import { createInvoiceSchema, ZodCreateInvoiceSchema } from "@/zod-schemas/invoice/create-invoice";
import { createBlobUrl, revokeBlobUrl } from "@/lib/invoice/create-blob-url";
import { parseCatchError } from "@/lib/neverthrow/parseCatchError";
import { invoiceErrorAtom } from "@/global/atoms/invoice-atom";
import { useMounted, useResizeObserver } from "@mantine/hooks";
import { createPdfBlob } from "@/lib/invoice/create-pdf-blob";
import PDFLoading from "@/components/layout/pdf/pdf-loading";
import PDFError from "@/components/layout/pdf/pdf-error";
import React, { useEffect, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { Document, Page } from "react-pdf";
import { useSetAtom } from "jotai";
import { debounce } from "lodash";

const PDF_VIEWER_PADDING = 18;

// Custom PDF viewer component that handles displaying a PDF document
const PDFViewer = ({ url, width }: { url: string | null; width: number }) => {
  const [error, setError] = useState<Error | null>(null);

  if (width === 0) {
    // setting width to 600px Because the container is not mounted yet
    width = 600;
  }

  // Show empty state if the url is not loaded
  if (!url) {
    return null;
  }

  return (
    <div className="flex h-full w-full items-center justify-center">
      <Document
        file={url}
        loading={null}
        onLoadError={(error) => {
          console.error("[ERROR]: Error loading PDF:", error);
          setError(error);
        }}
        className="scroll-bar-hidden dark:bg-background flex max-h-full w-full justify-center overflow-y-scroll py-[18px]"
      >
        {!error && (
          <Page
            pageNumber={1}
            width={width > 600 ? 600 - PDF_VIEWER_PADDING : width - PDF_VIEWER_PADDING}
            renderTextLayer={false}
            renderAnnotationLayer={false}
          />
        )}
      </Document>
    </div>
  );
};

const InvoicePreview = ({ form }: { form: UseFormReturn<ZodCreateInvoiceSchema> }) => {
  const isClient = useMounted();
  const [resizeRef, container] = useResizeObserver();
  const setInvoiceError = useSetAtom(invoiceErrorAtom);
  const [data, setData] = useState(form.getValues());
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string | null>(null);

  // Watch for form changes, debounce input, validate, and then update data/errors
  useEffect(() => {
    const processFormValue = (value: ZodCreateInvoiceSchema) => {
      // First verify the data if it matches the schema
      const isDataValid = createInvoiceSchema.safeParse(value);
      // If the data is valid, set the data to invoice and clear the errors
      if (isDataValid.success) {
        setData(value);
        setInvoiceError([]);
      } else {
        setInvoiceError(isDataValid.error.issues);
      }
    };

    // Create a debounced version of the processing function
    const debouncedProcessFormValue = debounce(processFormValue, 1000);

    const subscription = form.watch((value, { name, type }) => {
      if (!name || name.includes("ui.") || type === "blur") {
        return;
      }
      
      debouncedProcessFormValue(value as ZodCreateInvoiceSchema);
    });

    return () => {
      // Cleanup subscription and cancel any pending debounced calls
      subscription.unsubscribe();
      debouncedProcessFormValue.cancel();
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  // Effect to generate PDF when data changes
  useEffect(() => {
    setPdfError(null);

    const generatePdf = async () => {
      try {
        const blob = await createPdfBlob({ invoiceData: data });
        const newUrl = createBlobUrl({ blob });

        setGeneratedPdfUrl((prevUrl) => {
          if (prevUrl) {
            revokeBlobUrl({ url: prevUrl });
          }
          return newUrl;
        });
      } catch (err) {
        setPdfError(parseCatchError(err, "Failed to generate PDF content"));
        if (generatedPdfUrl) {
          revokeBlobUrl({ url: generatedPdfUrl });
        }
      }
    };

    generatePdf();

    // Cleanup on component unmount or when data changes again (before new generation)
    return () => {
      if (generatedPdfUrl) {
        revokeBlobUrl({ url: generatedPdfUrl });
      }
    };

    // Dont Include generatedPdfUrl in the dependency array as it will cause infinite re-renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // If there is an error loading the PDF, show an error message
  if (pdfError) {
    return (
      <div className="h-full w-full">
        <PDFError message={pdfError} />
      </div>
    );
  }

  return (
    <div ref={resizeRef} className="scroll-bar-hidden bg-sidebar h-full w-full overflow-y-auto">
      {!isClient || !generatedPdfUrl ? (
        <div className="h-full w-full">
          <PDFLoading />
        </div>
      ) : (
        <PDFViewer url={generatedPdfUrl} width={container.width} />
      )}
    </div>
  );
};

export default React.memo(InvoicePreview);
