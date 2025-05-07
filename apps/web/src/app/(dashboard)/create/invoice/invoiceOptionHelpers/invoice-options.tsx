import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ZodCreateInvoiceSchema } from "@/zod-schemas/invoice/create-invoice";
import { InteractableElement } from "@/components/ui/interactable-element";
import InvoiceErrorsModal from "./invoice-errors-modal";
import InvoiceTabSwitch from "./invoice-tab-switch";
import { InboxArrowDownIcon } from "@/assets/icons";
import { Button } from "@/components/ui/button";
import { UseFormReturn } from "react-hook-form";
import { useEffect, useState } from "react";
import { pdf } from "@react-pdf/renderer";
import InvoicePDF from "../pdf-document";
import { pdfjs } from "react-pdf";

const generatePdfBlob = (data: ZodCreateInvoiceSchema) => {
  return new Promise<Blob>((resolve, reject) => {
    try {
      const pdfDocument = <InvoicePDF data={data} />;
      pdf(pdfDocument)
        .toBlob()
        .then((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Failed to generate PDF"));
          }
        })
        .catch(reject);
    } catch (error) {
      reject(error);
    }
  });
};

const convertPdfPageToImage = async (pdfBlob: Blob, scale: number = 2): Promise<Blob> => {
  return new Promise(async (resolve, reject) => {
    try {
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const loadingTask = pdfjs.getDocument(pdfUrl);
      const pdf = await loadingTask.promise;

      const page = await pdf.getPage(1);

      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: ctx,
        viewport: viewport,
      };

      await page.render(renderContext).promise;

      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Failed to convert canvas to blob"));
        }
        URL.revokeObjectURL(pdfUrl);
      }, "image/png");
    } catch (error) {
      console.error("[ERROR]: Error converting PDF to PNG:", error);
      reject(error);
    }
  });
};

const downloadFile = (url: string, fileName: string) => {
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const InvoiceOptions = ({ form }: { form: UseFormReturn<ZodCreateInvoiceSchema> }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [formData, setFormData] = useState<ZodCreateInvoiceSchema>(form.getValues());

  // Update form data when dropdown is opened
  useEffect(() => {
    if (isDropdownOpen) {
      setFormData(form.getValues());
    }
  }, [isDropdownOpen, form]);

  useEffect(() => {
    try {
      if (typeof window !== "undefined" && !pdfjs.GlobalWorkerOptions.workerSrc) {
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url,
        ).toString();
      }
    } catch (error) {
      console.error("[ERROR]: Error setting up PDF worker:", error);
    }
  }, []);

  const handlePreview = () => {
    const data = form.getValues();

    const previewPdf = async () => {
      const blob = await generatePdfBlob(data);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    };

    previewPdf().catch((error) => {
      console.error("[ERROR]: Error previewing PDF:", error);
    });
  };

  const handlePdfDownload = (data: ZodCreateInvoiceSchema) => async () => {
    try {
      const blob = await generatePdfBlob(data);
      const url = URL.createObjectURL(blob);
      const fileName = `Invoice-${data.invoiceDetails.prefix}${data.invoiceDetails.serialNumber}.pdf`;
      downloadFile(url, fileName);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("[ERROR]: Error downloading PDF:", error);
    }
  };

  const handlePngDownload = (data: ZodCreateInvoiceSchema) => async () => {
    try {
      const pdfBlob = await generatePdfBlob(data);

      const pngBlob = await convertPdfPageToImage(pdfBlob);
      const pngUrl = URL.createObjectURL(pngBlob);

      const fileName = `Invoice-${data.invoiceDetails.prefix}${data.invoiceDetails.serialNumber}.png`;
      downloadFile(pngUrl, fileName);

      URL.revokeObjectURL(pngUrl);
    } catch (error) {
      console.error("[ERROR]: Error downloading PNG:", error);
    }
  };

  return (
    <div className="flex h-12 shrink-0 flex-row items-center justify-between gap-2 border-b px-2">
      <InteractableElement analytics={{ name: "error-modal-open", group: "create-invoice-page" }}>
        <InvoiceErrorsModal />
      </InteractableElement>
      <div className="flex flex-row items-center gap-2">
        <InvoiceTabSwitch />
        <DropdownMenu onOpenChange={setIsDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="default" analytics={{ name: "download-invoice-action", group: "create-invoice-page" }}>
              <InboxArrowDownIcon />
              Download
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handlePreview}>View PDF</DropdownMenuItem>
            <DropdownMenuItem onClick={handlePdfDownload(formData)}>Download PDF</DropdownMenuItem>
            <DropdownMenuItem onClick={handlePngDownload(formData)}>Download PNG</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default InvoiceOptions;
