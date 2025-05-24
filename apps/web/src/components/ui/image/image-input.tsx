// Image Component by OriginUI.com
/* eslint-disable @next/next/no-img-element */
"use client";

import { AlertCircleIcon, LoaderCircleIcon, XIcon } from "lucide-react";

import { useFileUpload } from "@/hooks/use-file-upload";
import { ImageSparkleIcon } from "@/assets/icons";
import { cn } from "@/lib/utils";

interface ImageInputProps {
  title?: string;
  maxSizeMB?: number;
  className?: string;
  defaultUrl?: string;
  allowPreview?: boolean;
  isLoading?: boolean;
  disableIcon?: boolean;
  onFileUpload?: (file: string) => void;
  onBase64Change?: (base64: string | undefined) => void;
  onFileRemove?: (file: string) => void;
  onFileChange?: (file: File) => void;
}

export default function ImageInput({
  title = "Drag & Drop or Click to Upload",
  maxSizeMB = 5,
  className,
  defaultUrl,
  allowPreview = true,
  isLoading = false,
  disableIcon = false,
  onFileUpload,
  onBase64Change,
  onFileRemove,
  onFileChange,
}: ImageInputProps) {
  const maxSize = maxSizeMB * 1024 * 1024; // 5MB default

  const [
    { files, isDragging, errors },
    { handleDragEnter, handleDragLeave, handleDragOver, handleDrop, openFileDialog, removeFile, getInputProps },
  ] = useFileUpload({
    accept: "image/png, image/jpeg, image/jpg",
    maxSize,
    onFilesAdded: (files) => {
      // if no file is added, return
      if (!files[0]) return;

      // onFileChange is the function that is called when the file is changed
      if (onFileChange) {
        onFileChange(files[0].file as File);
      }

      // preview url is the url of the image
      if (onFileUpload) {
        onFileUpload(files[0].preview || "");
      }

      // if base64 change is not provided, return
      if (onBase64Change) {
        // converting the file to base64
        const reader = new FileReader();
        reader.onload = () => {
          onBase64Change(reader.result as string);
        };
        reader.readAsDataURL(files[0].file as File);
      }
    },
  });

  const previewUrl = files[0]?.preview || defaultUrl || "";

  return (
    <div className={cn("flex w-full flex-col gap-1.5", className)}>
      <div className="relative">
        {/* Drop area */}
        <div
          role="button"
          onClick={openFileDialog}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          data-dragging={isDragging || undefined}
          className="border-input hover:bg-accent/50 data-[dragging=true]:bg-accent/50 relative flex aspect-square flex-col items-center justify-center overflow-hidden rounded-md border border-dashed p-4 transition-colors has-disabled:pointer-events-none has-disabled:opacity-50 has-[img]:border-none"
        >
          <input {...getInputProps()} className="sr-only" aria-label="Upload file" />
          {previewUrl && allowPreview && !isLoading ? (
            <div className="absolute inset-0">
              <img src={previewUrl} alt={files[0]?.file?.name || "Uploaded image"} className="size-full object-cover" />
            </div>
          ) : isLoading ? (
            <div className="flex flex-col items-center justify-center gap-2">
              <LoaderCircleIcon size={20} className={cn("animate-spin")} />
              <span className="text-muted-foreground text-xs">Uploading...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center px-4 py-3 text-center">
              {!disableIcon && (
                <div
                  className="bg-muted mb-2 flex size-7 shrink-0 items-center justify-center rounded-full sm:size-9"
                  aria-hidden="true"
                >
                  <ImageSparkleIcon className="size-4" />
                </div>
              )}
              <p className="text-[10px] font-medium sm:mb-1.5 sm:text-xs">{title}</p>
              {errors.length > 0 ? (
                <div className="flex items-center gap-1 text-[10px] text-red-500" role="alert">
                  {!disableIcon && <AlertCircleIcon className="size-3 shrink-0" />}
                  <span>{errors[0]}</span>
                </div>
              ) : (
                <p className="text-muted-foreground text-[10px]">Max size: {maxSizeMB * 1000}Kb (PNG, JPG)</p>
              )}
            </div>
          )}
        </div>
        {previewUrl && allowPreview && !isLoading && (
          <div className="absolute top-4 right-4">
            <button
              type="button"
              className="focus-visible:border-ring focus-visible:ring-ring/50 z-50 flex size-5 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white transition-[color,box-shadow] outline-none hover:bg-black/80 focus-visible:ring-[3px]"
              onClick={() => {
                removeFile(files[0]?.id);
                if (onFileRemove) {
                  onFileRemove(files[0]?.id);
                }
                if (onBase64Change) {
                  onBase64Change(undefined);
                }
              }}
              aria-label="Remove image"
            >
              <XIcon className="size-3" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
