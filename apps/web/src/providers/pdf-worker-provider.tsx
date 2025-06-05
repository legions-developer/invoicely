"use client";

import { pdfjs } from "react-pdf";
import React from "react";

if (typeof window !== "undefined" && !pdfjs.GlobalWorkerOptions.workerSrc) {
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
}

const PdfWorkerProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export { PdfWorkerProvider };
