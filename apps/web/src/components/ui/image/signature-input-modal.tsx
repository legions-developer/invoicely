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
import { ImageSparkleIcon, SignatureIcon } from "@/assets/icons";
import { createBlobUrl } from "@/lib/invoice/create-blob-url";
import { useFileUpload } from "@/hooks/use-file-upload";
import { AlertCircleIcon, XIcon } from "lucide-react";
import SignatureCanvas from "react-signature-canvas";
import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Button } from "../button";
import { toast } from "sonner";

interface SignatureInputModalProps {
  title?: string;
  className?: string;
  onSignatureChange?: (signature: string) => void;
  defaultUrl?: string;
  onBase64Change?: (base64: string | undefined) => void;
  onFileRemove?: () => void;
  isDarkMode?: boolean;
  maxSizeMB?: number;
}

export default function SignatureInputModal({
  title = "Click here to draw your signature",
  //   className,
  onSignatureChange,
  defaultUrl,
  onBase64Change,
  onFileRemove,
  isDarkMode = false,
  maxSizeMB = 5,
}: SignatureInputModalProps) {
  const [type, setType] = useState<"signature" | "upload" | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const signaturePadRef = useRef<SignatureCanvas>(null);
  const [isSignatureEmpty, setIsSignatureEmpty] = useState<boolean>(true);

  const maxSize = maxSizeMB * 1024 * 1024; // 5MB default

  const [
    { files, isDragging, errors },
    { handleDragEnter, handleDragLeave, handleDragOver, handleDrop, openFileDialog, removeFile, getInputProps },
  ] = useFileUpload({
    accept: "image/png, image/jpeg, image/jpg",
    maxSize,
  });

  const previewUrl = defaultUrl || "";

  // For signature upload via file input
  useEffect(() => {
    if (type !== "upload") return;

    if (onSignatureChange) {
      onSignatureChange(files[0]?.preview || "");
    }

    if (onBase64Change && files[0]) {
      // converting the file to base64
      const reader = new FileReader();
      reader.onload = () => {
        onBase64Change(reader.result as string);
      };
      reader.readAsDataURL(files[0].file as File);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewUrl, files, onSignatureChange, onBase64Change]);

  // Handle Clear signature
  const handleClear = () => {
    signaturePadRef.current?.clear();
  };

  // Handle and Save signature
  const handleSave = () => {
    if (type !== "signature") return;
    //   get the signature canvas
    const signatureCanvasUri = signaturePadRef.current?.toDataURL("image/png");

    if (!signatureCanvasUri) {
      toast.error("No signature found", {
        description: "Please draw your signature and try again",
      });
      return;
    }

    // set it to onBase64Change
    if (onBase64Change && signatureCanvasUri) {
      onBase64Change(signatureCanvasUri);
    }

    // Convert to blob
    const signatureBlob = CreatePngFromBase64(signatureCanvasUri);

    if (!signatureBlob) {
      toast.error("No signature found", {
        description: "Please draw your signature and try again",
      });
      return;
    }

    const signatureBlobUrl = createBlobUrl({ blob: signatureBlob });

    // set it to onSignatureChange
    if (onSignatureChange && signatureBlob) {
      onSignatureChange(signatureBlobUrl);
    }

    // set modal to close
    setIsModalOpen(false);
    // reset signature
    signaturePadRef.current?.clear();
    setIsSignatureEmpty(true);
  };

  // Handle and Reset states when modal is closed
  const handleModalChange = (open: boolean) => {
    setIsModalOpen(open);

    if (!open) {
      //   reset signature
      signaturePadRef.current?.clear();
      setIsSignatureEmpty(true);
    }
  };

  return (
    <>
      <div className="relative">
        {/* Drop area */}
        <div className="border-input relative flex aspect-square flex-col items-center justify-center overflow-hidden rounded-md border border-dashed transition-colors has-disabled:pointer-events-none has-disabled:opacity-50 has-[img]:border-none has-[input:focus]:ring-[3px] sm:min-h-52">
          {previewUrl ? (
            <div className="absolute inset-0">
              <img src={previewUrl} alt="user signature" className="size-full object-cover" />
            </div>
          ) : (
            <div className="flex h-full w-full flex-col">
              {/* Custom Signature */}
              <div
                role="button"
                onClick={() => {
                  setType("signature");
                  setIsModalOpen(true);
                }}
                className="hover:bg-accent/50 flex h-full flex-col items-center justify-center border-b border-dashed text-center"
              >
                <div
                  className="bg-muted mb-2 flex size-8 shrink-0 items-center justify-center rounded-full sm:size-11"
                  aria-hidden="true"
                >
                  <SignatureIcon className="size-4 rotate-12" />
                </div>
                <p className="text-[10px] font-medium sm:mb-1.5 sm:text-xs">{title}</p>
                <p className="text-muted-foreground text-[10px]">Canvas size: 330x330px</p>
              </div>
              {/* Image Input for signature */}
              <div
                role="button"
                onClick={() => {
                  setType("upload");
                  openFileDialog();
                }}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                data-dragging={isDragging || undefined}
                className="hover:bg-accent/50 data-[dragging=true]:bg-accent/50 has-[input:focus]:border-ring has-[input:focus]:ring-ring/50 flex h-full flex-col items-center justify-center text-center"
              >
                <input {...getInputProps()} className="sr-only" aria-label="Upload file" />
                <div
                  className="bg-muted mb-2 flex size-8 shrink-0 items-center justify-center rounded-full sm:size-11"
                  aria-hidden="true"
                >
                  <ImageSparkleIcon className="size-4" />
                </div>
                <p className="text-[10px] font-medium sm:mb-1.5 sm:text-xs">Upload Signature</p>
                {errors.length > 0 ? (
                  <div className="flex items-center gap-1 text-[10px] text-red-500" role="alert">
                    <AlertCircleIcon className="size-3 shrink-0" />
                    <span>{errors[0]}</span>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-[10px]">Max size: 5MB (PNG, JPG)</p>
                )}
              </div>
            </div>
          )}
        </div>
        {previewUrl && (
          <div className="absolute top-4 right-4">
            <button
              type="button"
              className="focus-visible:border-ring focus-visible:ring-ring/50 z-50 flex size-5 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white transition-[color,box-shadow] outline-none hover:bg-black/80 focus-visible:ring-[3px]"
              onClick={(e) => {
                e.preventDefault();

                removeFile(files[0]?.id);

                if (onFileRemove) {
                  onFileRemove();
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
      {/* Signature Input Modal */}
      <Dialog open={isModalOpen} onOpenChange={handleModalChange}>
        <DialogContent className="w-fit">
          <DialogHeaderContainer>
            <DialogIcon>
              <SignatureIcon className="size-4 rotate-12" />
            </DialogIcon>
            <DialogHeader>
              <DialogTitle>Company Signature</DialogTitle>
              <DialogDescription>Draw your signature here</DialogDescription>
            </DialogHeader>
          </DialogHeaderContainer>
          <DialogContentContainer>
            <div className="relative overflow-hidden rounded-md border">
              {!isSignatureEmpty && (
                <motion.div
                  key="signature-clear-btn"
                  initial={{ filter: "blur(1px)", top: -24 }}
                  animate={{ filter: "blur(0px)", top: 6 }}
                  exit={{ filter: "blur(1px)", top: -24 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="absolute right-1.5 z-10 flex items-center justify-center"
                >
                  <Button variant="destructive" size="xs" onClick={handleClear}>
                    Clear
                  </Button>
                </motion.div>
              )}
              <SignatureCanvas
                key={`signature-canvas-${isDarkMode}`}
                ref={signaturePadRef}
                onBegin={() => setIsSignatureEmpty(false)}
                penColor={isDarkMode ? "white" : "black"}
                backgroundColor={isDarkMode ? "#181818" : "#ffffff"}
                canvasProps={{ width: 330, height: 330, className: "signature-canvas" }}
              />
            </div>
          </DialogContentContainer>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
