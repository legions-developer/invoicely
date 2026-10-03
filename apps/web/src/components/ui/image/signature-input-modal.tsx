/* eslint-disable @next/next/no-img-element */
"use client";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogContentContainer,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogHeaderContainer,
  DialogIcon,
  DialogTitle,
} from "@/components/ui/dialog";
import { CreatePngFromBase64 } from "@/lib/invoice/create-png-from-base64";
import { AlertCircleIcon, LoaderCircleIcon, XIcon } from "lucide-react";
import { ImageSparkleIcon, SignatureIcon } from "@/assets/icons";
import { useFileUpload } from "@/hooks/use-file-upload";
import SignatureCanvas from "react-signature-canvas";
import { readFileAsBase64 } from "./image-input";
import { useId, useRef, useState } from "react";
import { MiniSwitch } from "../switch";
import { Button } from "../button";
import { cn } from "@/lib/utils";

interface SignatureInputModalProps {
  title?: string;
  className?: string;
  defaultUrl?: string;
  isDarkMode?: boolean;
  maxSizeMB?: number;
  compact?: boolean;
  allowPreview?: boolean;
  isLoading?: boolean;
  loadingLabel?: string;
  disableIcon?: boolean;
  onBase64Change?: (base64: string | undefined) => void | Promise<void>;
  onFileRemove?: () => void;
  onSignatureChange?: (signature: string) => void;
}

export default function SignatureInputModal({
  title = "Draw a signature",
  className,
  defaultUrl,
  isDarkMode = false,
  maxSizeMB = 5,
  compact = false,
  allowPreview = true,
  isLoading = false,
  loadingLabel = "Saving…",
  disableIcon = false,
  onSignatureChange,
  onBase64Change,
  onFileRemove,
}: SignatureInputModalProps) {
  const [darkMode, setDarkMode] = useState(isDarkMode);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSignatureEmpty, setIsSignatureEmpty] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [saveError, setSaveError] = useState<string>();
  const signaturePadRef = useRef<SignatureCanvas>(null);
  const drawButtonRef = useRef<HTMLButtonElement>(null);
  const uploadContainerRef = useRef<HTMLDivElement>(null);
  const processingRef = useRef(false);
  const darkModeId = useId();
  const uploadDescriptionId = useId();
  const maxSize = maxSizeMB * 1_000_000;
  const sizeLabel = maxSizeMB < 1 ? `${maxSizeMB * 1000} KB` : `${maxSizeMB} MB`;
  const isBusy = isLoading || isProcessing;

  const [
    { files, isDragging, errors },
    { handleDragEnter, handleDragLeave, handleDragOver, handleDrop, openFileDialog, clearFiles, getInputProps },
  ] = useFileUpload({
    accept: "image/png, image/jpeg",
    maxSize,
    onFilesAdded: async (addedFiles) => {
      const addedFile = addedFiles[0];
      if (!addedFile || isLoading || processingRef.current) return;
      processingRef.current = true;
      setIsProcessing(true);
      setSaveError(undefined);
      try {
        if (onBase64Change) await onBase64Change(await readFileAsBase64(addedFile.file as File));
        onSignatureChange?.(addedFile.preview || "");
        if (!allowPreview && !onSignatureChange) clearFiles();
      } catch (error) {
        setSaveError(error instanceof Error ? error.message : "Couldn't save this signature. Please try again.");
        clearFiles();
      } finally {
        processingRef.current = false;
        setIsProcessing(false);
      }
    },
  });

  const previewUrl = defaultUrl || files[0]?.preview || "";
  const error = saveError || errors[0];

  const handleClear = () => {
    signaturePadRef.current?.clear();
    setIsSignatureEmpty(true);
    setSaveError(undefined);
  };

  const handleSave = async () => {
    const canvas = signaturePadRef.current;
    if (isBusy || processingRef.current || !canvas || canvas.isEmpty()) return;

    processingRef.current = true;
    setIsProcessing(true);
    setSaveError(undefined);
    try {
      const base64 = canvas.toDataURL("image/png");
      const blob = CreatePngFromBase64(base64);
      if (!blob) throw new Error("Please draw your signature and try again.");
      if (blob.size > maxSize) throw new Error(`This signature is too large. Please keep it under ${sizeLabel}.`);

      await onBase64Change?.(base64);
      if (onSignatureChange) onSignatureChange(URL.createObjectURL(blob));
      setIsModalOpen(false);
      handleClear();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Couldn't save this signature. Please try again.");
    } finally {
      processingRef.current = false;
      setIsProcessing(false);
    }
  };

  const handleModalChange = (open: boolean) => {
    // A settings refresh can fail while the dialog is open. Only an active
    // save should prevent dismissal; users still need access to account retry.
    if (isProcessing || processingRef.current) return;
    setIsModalOpen(open);
    if (!open) handleClear();
  };

  return (
    <>
      <div ref={uploadContainerRef} tabIndex={-1} className={cn("flex w-full flex-col gap-1.5", className)}>
        <div className="relative">
          <input {...getInputProps({ disabled: isBusy, tabIndex: -1 })} hidden aria-label="Upload signature image" />
          <div
            aria-busy={isBusy}
            className={cn(
              "border-input bg-muted/15 relative flex w-full flex-col overflow-hidden rounded-xl border border-dashed",
              compact ? "min-h-[180px]" : "aspect-square",
            )}
          >
            {isBusy ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6" role="status">
                <LoaderCircleIcon className="size-5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                <span className="text-muted-foreground text-xs">{loadingLabel}</span>
              </div>
            ) : previewUrl && allowPreview ? (
              <img src={previewUrl} alt="Your signature" className="absolute inset-0 size-full object-contain p-3" />
            ) : (
              <>
                <button
                  ref={drawButtonRef}
                  type="button"
                  disabled={isBusy}
                  onClick={() => {
                    setSaveError(undefined);
                    setIsModalOpen(true);
                  }}
                  className="hover:bg-accent/50 focus-visible:ring-ring flex flex-1 cursor-pointer flex-col items-center justify-center gap-1.5 border-b border-dashed px-3 py-3 text-center outline-none focus-visible:ring-2 focus-visible:ring-inset disabled:opacity-60"
                >
                  {!disableIcon && <SignatureIcon className="text-primary size-5" aria-hidden="true" />}
                  <span className="text-sm font-medium">{title}</span>
                  <span className="text-muted-foreground text-[11px]">Use your mouse or finger</span>
                </button>
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={openFileDialog}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  data-dragging={isDragging || undefined}
                  aria-describedby={uploadDescriptionId}
                  className="hover:bg-accent/50 data-[dragging=true]:bg-accent focus-visible:ring-ring flex flex-1 cursor-pointer flex-col items-center justify-center gap-1.5 px-3 py-3 text-center outline-none focus-visible:ring-2 focus-visible:ring-inset disabled:opacity-60"
                >
                  {!disableIcon && <ImageSparkleIcon className="text-muted-foreground size-5" aria-hidden="true" />}
                  <span className="text-sm font-medium">Upload a signature</span>
                  <span id={uploadDescriptionId} className="text-muted-foreground text-[11px]">
                    PNG or JPG · up to {sizeLabel}
                  </span>
                </button>
              </>
            )}
          </div>
          {previewUrl && allowPreview && !isBusy && (
            <button
              type="button"
              className="bg-background/90 text-foreground focus-visible:ring-ring absolute top-2 right-2 flex size-8 cursor-pointer items-center justify-center rounded-full border shadow-sm outline-none focus-visible:ring-2"
              onClick={async () => {
                clearFiles();
                onFileRemove?.();
                try {
                  await onBase64Change?.(undefined);
                } catch (error) {
                  setSaveError(error instanceof Error ? error.message : "Couldn't remove this signature.");
                }
              }}
              aria-label="Remove signature"
            >
              <XIcon className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>
        {error && !isModalOpen && (
          <p className="text-destructive flex items-start gap-1.5 text-xs" role="alert">
            <AlertCircleIcon className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}
      </div>
      <Dialog open={isModalOpen} onOpenChange={handleModalChange}>
        <DialogContent
          className="sm:max-w-sm"
          hideCloseButton={isProcessing}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            (drawButtonRef.current ?? uploadContainerRef.current)?.focus();
          }}
        >
          <DialogHeaderContainer>
            <DialogIcon>
              <SignatureIcon className="size-5" aria-hidden="true" />
            </DialogIcon>
            <DialogHeader>
              <DialogTitle>Draw your signature</DialogTitle>
              <DialogDescription>Use your mouse or finger on the canvas below.</DialogDescription>
            </DialogHeader>
          </DialogHeaderContainer>
          <DialogContentContainer>
            <div
              className={cn("relative overflow-hidden rounded-lg border", isBusy && "pointer-events-none opacity-60")}
            >
              <SignatureCanvas
                key={`signature-canvas-${darkMode}`}
                ref={signaturePadRef}
                onEnd={() => setIsSignatureEmpty(signaturePadRef.current?.isEmpty() ?? true)}
                penColor={darkMode ? "white" : "black"}
                backgroundColor={darkMode ? "#181818" : "#ffffff"}
                canvasProps={{
                  "aria-label": "Signature drawing canvas",
                  className: "signature-canvas aspect-square w-full max-w-[330px] touch-none",
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="absolute top-2 right-2"
                onClick={handleClear}
                disabled={isBusy || isSignatureEmpty}
              >
                Clear
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <MiniSwitch
                id={darkModeId}
                checked={darkMode}
                disabled={isBusy}
                onCheckedChange={(checked) => {
                  setDarkMode(checked);
                  setIsSignatureEmpty(true);
                  setSaveError(undefined);
                }}
              />
              <label htmlFor={darkModeId} className="text-muted-foreground text-xs">
                Dark background
              </label>
            </div>
            {saveError && (
              <p className="text-destructive text-xs" role="alert">
                {saveError}
              </p>
            )}
          </DialogContentContainer>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isProcessing}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="button" onClick={handleSave} disabled={isBusy || isSignatureEmpty}>
              {isBusy && (
                <LoaderCircleIcon
                  data-icon="inline-start"
                  className="animate-spin motion-reduce:animate-none"
                  aria-hidden="true"
                />
              )}
              {isBusy ? "Saving…" : "Save signature"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
