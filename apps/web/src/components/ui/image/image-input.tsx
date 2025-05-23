// Image Component by OriginUI.com
/* eslint-disable @next/next/no-img-element */
"use client";

import { AlertCircleIcon, XIcon } from "lucide-react";

import { useFileUpload } from "@/hooks/use-file-upload";
import { ImageSparkleIcon } from "@/assets/icons";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

interface ImageInputProps {
  title?: string;
  maxSizeMB?: number;
  className?: string;
  onFileUpload?: (file: string) => void;
  defaultUrl?: string;
  onBase64Change?: (base64: string) => void;
  onFileRemove?: (file: string) => void;
}

export default function ImageInput({
  title = "Drag & Drop or Click to Upload",
  maxSizeMB = 5,
  className,
  onFileUpload,
  defaultUrl,
  onBase64Change,
  onFileRemove,
}: ImageInputProps) {
  const maxSize = maxSizeMB * 1024 * 1024; // 5MB default

  const [
    { files, isDragging, errors },
    { handleDragEnter, handleDragLeave, handleDragOver, handleDrop, openFileDialog, removeFile, getInputProps },
  ] = useFileUpload({
    accept: "image/png, image/jpeg, image/jpg",
    maxSize,
  });

  const previewUrl = files[0]?.preview || defaultUrl || "";

  useEffect(() => {
    if (onFileUpload) {
      onFileUpload(previewUrl);
    }

    if (onBase64Change && files[0]) {
      // converting the file to base64
      const reader = new FileReader();
      reader.onload = () => {
        onBase64Change(reader.result as string);
      };
      reader.readAsDataURL(files[0].file as File);
    }
  }, [previewUrl, onFileUpload, onBase64Change, files]);

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
          className="border-input hover:bg-accent/50 data-[dragging=true]:bg-accent/50 has-[input:focus]:border-ring has-[input:focus]:ring-ring/50 s relative flex aspect-square flex-col items-center justify-center overflow-hidden rounded-md border border-dashed p-4 transition-colors has-disabled:pointer-events-none has-disabled:opacity-50 has-[img]:border-none has-[input:focus]:ring-[3px] sm:min-h-52"
        >
          <input {...getInputProps()} className="sr-only" aria-label="Upload file" />
          {previewUrl ? (
            <div className="absolute inset-0">
              <img src={previewUrl} alt={files[0]?.file?.name || "Uploaded image"} className="size-full object-cover" />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center px-4 py-3 text-center">
              <div
                className="bg-muted mb-2 flex size-8 shrink-0 items-center justify-center rounded-full sm:size-11"
                aria-hidden="true"
              >
                <ImageSparkleIcon className="size-4" />
              </div>
              <p className="text-[10px] font-medium sm:mb-1.5 sm:text-xs">{title}</p>
              {errors.length > 0 ? (
                <div className="flex items-center gap-1 text-[10px] text-red-500" role="alert">
                  <AlertCircleIcon className="size-3 shrink-0" />
                  <span>{errors[0]}</span>
                </div>
              ) : (
                <p className="text-muted-foreground text-[10px]">Max size: {maxSizeMB}MB (PNG, JPG)</p>
              )}
            </div>
          )}
        </div>
        {previewUrl && (
          <div className="absolute top-4 right-4">
            <button
              type="button"
              className="focus-visible:border-ring focus-visible:ring-ring/50 z-50 flex size-5 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white transition-[color,box-shadow] outline-none hover:bg-black/80 focus-visible:ring-[3px]"
              onClick={() => {
                removeFile(files[0]?.id);
                if (onFileRemove) {
                  onFileRemove(files[0]?.id);
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
