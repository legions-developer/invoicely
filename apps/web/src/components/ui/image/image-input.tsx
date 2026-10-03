/* eslint-disable @next/next/no-img-element */
"use client";

import { AlertCircleIcon, LoaderCircleIcon, XIcon } from "lucide-react";
import { useFileUpload } from "@/hooks/use-file-upload";
import { ImageSparkleIcon } from "@/assets/icons";
import { useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface ImageInputProps {
  title?: string;
  maxSizeMB?: number;
  className?: string;
  defaultUrl?: string;
  compact?: boolean;
  allowPreview?: boolean;
  isLoading?: boolean;
  loadingLabel?: string;
  disableIcon?: boolean;
  onFileUpload?: (file: string) => void;
  onBase64Change?: (base64: string | undefined) => void | Promise<void>;
  onFileRemove?: (file: string) => void;
  onFileChange?: (file: File) => void;
}

export function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("This image couldn't be read. Please choose it again."));
    reader.onabort = () => reject(new Error("Reading the image was cancelled."));
    reader.readAsDataURL(file);
  });
}

export default function ImageInput({
  title = "Upload an image",
  maxSizeMB = 5,
  className,
  defaultUrl,
  compact = false,
  allowPreview = true,
  isLoading = false,
  loadingLabel = "Saving…",
  disableIcon = false,
  onFileUpload,
  onBase64Change,
  onFileRemove,
  onFileChange,
}: ImageInputProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadError, setUploadError] = useState<string>();
  const processingRef = useRef(false);
  const descriptionId = useId();
  const isBusy = isLoading || isProcessing;
  const maxSize = maxSizeMB * 1_000_000;
  const sizeLabel = maxSizeMB < 1 ? `${maxSizeMB * 1000} KB` : `${maxSizeMB} MB`;

  const [
    { files, isDragging, errors },
    {
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      removeFile,
      clearFiles,
      getInputProps,
    },
  ] = useFileUpload({
    accept: "image/png, image/jpeg",
    maxSize,
    onFilesAdded: async (addedFiles) => {
      const addedFile = addedFiles[0];
      if (!addedFile || isLoading || processingRef.current) return;
      processingRef.current = true;
      setIsProcessing(true);
      setUploadError(undefined);
      try {
        const file = addedFile.file as File;
        if (onBase64Change) await onBase64Change(await readFileAsBase64(file));
        onFileChange?.(file);
        onFileUpload?.(addedFile.preview || "");
        if (!allowPreview) clearFiles();
      } catch (error) {
        setUploadError(error instanceof Error ? error.message : "Couldn't save this image. Please try again.");
        clearFiles();
      } finally {
        processingRef.current = false;
        setIsProcessing(false);
      }
    },
  });

  const previewUrl = files[0]?.preview || defaultUrl || "";
  const error = uploadError || errors[0];

  return (
    <div className={cn("flex w-full flex-col gap-1.5", className)}>
      <div className="relative">
        <input {...getInputProps({ disabled: isBusy, tabIndex: -1 })} hidden aria-label={title} />
        <button
          type="button"
          disabled={isBusy}
          aria-label={previewUrl && allowPreview ? "Replace image" : title}
          aria-describedby={descriptionId}
          aria-busy={isBusy}
          onClick={openFileDialog}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          data-dragging={isDragging || undefined}
          className={cn(
            "border-input bg-muted/15 hover:border-primary/50 hover:bg-accent/50 data-[dragging=true]:border-primary data-[dragging=true]:bg-accent focus-visible:ring-ring relative flex w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed p-4 text-center outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60",
            compact ? "min-h-[180px]" : "aspect-square",
          )}
        >
          {isBusy ? (
            <span className="flex flex-col items-center justify-center gap-2" role="status">
              <LoaderCircleIcon className="size-5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
              <span className="text-muted-foreground text-xs">{loadingLabel}</span>
            </span>
          ) : previewUrl && allowPreview ? (
            <img
              src={previewUrl}
              alt={files[0]?.file?.name || "Uploaded image"}
              className="absolute inset-0 size-full object-contain p-3"
            />
          ) : (
            <span className="flex flex-col items-center justify-center gap-2">
              {!disableIcon && (
                <span
                  className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl"
                  aria-hidden="true"
                >
                  <ImageSparkleIcon className="size-5" />
                </span>
              )}
              <span className="text-sm font-medium">{title}</span>
              <span className="text-muted-foreground text-xs">Click to browse or drop here</span>
            </span>
          )}
          <span
            id={descriptionId}
            className={cn(
              "text-muted-foreground mt-2 text-[11px]",
              (isBusy || (previewUrl && allowPreview)) && "sr-only",
            )}
          >
            PNG or JPG · up to {sizeLabel}
          </span>
        </button>
        {previewUrl && allowPreview && !isBusy && (
          <button
            type="button"
            className="bg-background/90 text-foreground focus-visible:ring-ring absolute top-2 right-2 flex size-8 cursor-pointer items-center justify-center rounded-full border shadow-sm outline-none focus-visible:ring-2"
            onClick={async () => {
              const fileId = files[0]?.id;
              if (fileId) removeFile(fileId);
              onFileRemove?.(fileId || "");
              try {
                await onBase64Change?.(undefined);
              } catch (error) {
                setUploadError(error instanceof Error ? error.message : "Couldn't remove this image.");
              }
            }}
            aria-label="Remove image"
          >
            <XIcon className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>
      {error && (
        <p className="text-destructive flex items-start gap-1.5 text-xs" role="alert">
          <AlertCircleIcon className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}
