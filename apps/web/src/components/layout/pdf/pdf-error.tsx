import { FileAlertIcon } from "@/assets/icons";
import React from "react";

const PDFError = ({ message, title }: { message: string; title?: string }) => {
  return (
    <div className="bg-background flex h-full items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="bg-destructive/10 text-destructive flex h-14 w-14 items-center justify-center rounded-lg">
          <FileAlertIcon />
        </div>
        <div className="flex flex-col">
          <p className="text-destructive font-semibold">{title || "Error While Generating PDF"}</p>
          <p className="text-muted-foreground max-w-md text-xs">{message}</p>
        </div>
      </div>
    </div>
  );
};

export default PDFError;
