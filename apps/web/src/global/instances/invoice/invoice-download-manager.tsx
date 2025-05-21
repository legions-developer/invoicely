import { ZodCreateInvoiceSchema } from "@/zod-schemas/invoice/create-invoice";
import { createBlobUrl, revokeBlobUrl } from "@/lib/invoice/create-blob-url";
import { generateInvoiceName } from "@/lib/invoice/generate-invoice-name";
import { insertInvoice } from "@/actions/invoice/insertInvoice.action";
import { createPdfToImage } from "@/lib/invoice/create-pdf-to-image";
import { forceInsertInvoice } from "@/lib/indexdb-queries/invoice";
import { createPdfBlob } from "@/lib/invoice/create-pdf-blob";
import { downloadFile } from "@/lib/invoice/download-file";
import { asyncTryCatch } from "@/lib/neverthrow/tryCatch";
import type { AuthUser } from "@/types/auth";
import { toast } from "sonner";

export class InvoiceDownloadManager {
  private invoiceData: ZodCreateInvoiceSchema | undefined;
  private invoiceName: string | undefined;
  private blob: Blob | undefined;
  private user: AuthUser | undefined;

  // Initialize the invoice data
  public async initialize(invoice: ZodCreateInvoiceSchema, user: AuthUser | undefined): Promise<void> {
    // Cleanup resources
    this.cleanup();

    // Initialize the invoice data
    this.invoiceData = invoice;
    this.invoiceName = generateInvoiceName({ invoiceData: invoice, extension: "pdf" });
    this.blob = await createPdfBlob({ invoiceData: this.isInvoiceDataInitialized() });
    this.user = user;
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
    // Save data to indexedDB
    await this.saveInvoiceToIndexedDB();
  }

  // Download the PDF
  public async downloadPdf() {
    // const url = createBlobUrl({ blob: this.isBlobInitialized() });
    // downloadFile({ url, fileName: this.isInvoiceNameInitialized() });
    // revokeBlobUrl({ url });

    // Save data to indexedDB
    await this.saveInvoiceToIndexedDB();
  }

  private async saveInvoiceToIndexedDB(): Promise<void> {
    // If user have allowed saving data in db then save data to db
    if (this.user && this.user.allowedSavingData) {
      const insertingInvoicePromise = await insertInvoice(this.isInvoiceDataInitialized());
      if (!insertingInvoicePromise.success) {
        toast.error("Database Error", {
          description: `Error saving invoice to database`,
        });
      }
    } else {
      const { success } = await asyncTryCatch(forceInsertInvoice(this.isInvoiceDataInitialized()));
      if (!success) {
        toast.error("IndexDB Error", {
          description: "Error saving invoice to indexedDB",
        });
      }
    }
  }

  // Cleanup resources
  public cleanup(): void {
    // Reset class properties
    this.invoiceData = undefined;
    this.invoiceName = undefined;
    this.blob = undefined;
    this.user = undefined;
  }

  //   Error Handling
  private isBlobInitialized(): Blob {
    if (!this.blob) {
      toast.error("Blob not initialized. Initialize the InvoiceDownloadManager");
      throw new Error("Blob not initialized. Initialize the InvoiceDownloadManager");
    }
    return this.blob;
  }

  private isInvoiceDataInitialized(): ZodCreateInvoiceSchema {
    if (!this.invoiceData) {
      toast.error("Invoice data not initialized. Initialize the InvoiceDownloadManager");
      throw new Error("Invoice data not initialized. Initialize the InvoiceDownloadManager");
    }
    return this.invoiceData;
  }

  private isInvoiceNameInitialized(): string {
    if (!this.invoiceName) {
      toast.error("Invoice name not initialized. Initialize the InvoiceDownloadManager");
      throw new Error("Invoice name not initialized. Initialize the InvoiceDownloadManager");
    }
    return this.invoiceName;
  }
}

export const InvoiceDownloadManagerInstance = new InvoiceDownloadManager();
