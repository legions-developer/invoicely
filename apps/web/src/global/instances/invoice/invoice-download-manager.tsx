import { ZodCreateInvoiceSchema } from "@/zod-schemas/invoice/create-invoice";
import { createBlobUrl, revokeBlobUrl } from "@/lib/invoice/create-blob-url";
import { generateInvoiceName } from "@/lib/invoice/generate-invoice-name";
import { createPdfToImage } from "@/lib/invoice/create-pdf-to-image";
import { createPdfBlob } from "@/lib/invoice/create-pdf-blob";
import { downloadFile } from "@/lib/invoice/download-file";
import { ERROR_MESSAGES } from "@/constants/issues";
import { toast } from "sonner";

export class InvoiceDownloadManager {
  private invoiceData: ZodCreateInvoiceSchema | undefined;
  private invoiceName: string | undefined;
  private blob: Blob | undefined;

  // Initialize the invoice data
  public async initialize(invoice: ZodCreateInvoiceSchema): Promise<void> {
    // Cleanup resources
    this.cleanup();

    // Initialize the invoice data
    this.invoiceData = invoice;
    this.invoiceName = generateInvoiceName({ invoiceData: invoice, extension: "pdf" });
    this.blob = await createPdfBlob({ invoiceData: this.isInvoiceDataInitialized() });
  }

  // Preview the PDF - we dont save data on preview
  public async previewPdf() {
    const url = createBlobUrl({ blob: this.isBlobInitialized() });
    window.open(url, "_blank");
    revokeBlobUrl({ url });
  }

  // Download PNG
  public async downloadPng() {
    const blob = await createPdfToImage({ pdfBlob: this.isBlobInitialized(), scale: 2 });
    const url = createBlobUrl({ blob });
    // we need name with png extension
    const fileName = generateInvoiceName({ invoiceData: this.isInvoiceDataInitialized(), extension: "png" });
    downloadFile({ url, fileName });
    revokeBlobUrl({ url });
  }

  // Download the PDF
  public async downloadPdf() {
    const url = createBlobUrl({ blob: this.isBlobInitialized() });
    downloadFile({ url, fileName: this.isInvoiceNameInitialized() });
    revokeBlobUrl({ url });
  }

  // Cleanup resources
  public cleanup(): void {
    // Reset class properties
    this.invoiceData = undefined;
    this.invoiceName = undefined;
    this.blob = undefined;
  }

  //   Error Handling
  private isBlobInitialized(): Blob {
    if (!this.blob) {
      toast.error(ERROR_MESSAGES.BLOB_NOT_INITIALIZED);
      throw new Error(ERROR_MESSAGES.BLOB_NOT_INITIALIZED);
    }
    return this.blob;
  }

  private isInvoiceDataInitialized(): ZodCreateInvoiceSchema {
    if (!this.invoiceData) {
      toast.error(ERROR_MESSAGES.INVOICE_DATA_NOT_INITIALIZED);
      throw new Error(ERROR_MESSAGES.INVOICE_DATA_NOT_INITIALIZED);
    }
    return this.invoiceData;
  }

  private isInvoiceNameInitialized(): string {
    if (!this.invoiceName) {
      toast.error(ERROR_MESSAGES.INVOICE_NAME_NOT_INITIALIZED);
      throw new Error(ERROR_MESSAGES.INVOICE_NAME_NOT_INITIALIZED);
    }
    return this.invoiceName;
  }
}

export const InvoiceDownloadManagerInstance = new InvoiceDownloadManager();
