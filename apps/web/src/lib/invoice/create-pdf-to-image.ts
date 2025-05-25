import { ERROR_MESSAGES } from "@/constants/issues";
import { revokeBlobUrl } from "./create-blob-url";
import { pdfjs } from "react-pdf";

interface CreatePdfToImageProps {
  pdfBlob: Blob;
  scale: number;
}

export const createPdfToImage = async ({ pdfBlob, scale = 2 }: CreatePdfToImageProps): Promise<Blob> => {
  const pdfUrl = URL.createObjectURL(pdfBlob);
  const loadingTask = pdfjs.getDocument(pdfUrl);
  const pdf = await loadingTask.promise;

  const page = await pdf.getPage(1);

  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error(ERROR_MESSAGES.FAILED_TO_GET_CANVAS_CONTEXT);
  }

  canvas.height = viewport.height;
  canvas.width = viewport.width;

  const renderContext = {
    canvasContext: ctx,
    viewport: viewport,
  };

  await page.render(renderContext).promise;

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error(ERROR_MESSAGES.FAILED_TO_CONVERT_CANVAS_TO_BLOB));
        return;
      }

      revokeBlobUrl({ url: pdfUrl });
      resolve(blob);
    }, "image/png");
  });
};
