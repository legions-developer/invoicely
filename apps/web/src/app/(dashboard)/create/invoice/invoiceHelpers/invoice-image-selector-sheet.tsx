"use client";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import UploadSignatureAsset from "@/app/(dashboard)/assets/upload-signature.asset";
import { createBlobFromBase64 } from "@/lib/invoice/create-blob-from-base64";
import UploadLogoAsset from "@/app/(dashboard)/assets/upload-logo-asset";
import { getImagesWithKey } from "@/lib/manage-assets/getImagesWithKey";
import { ImageSparkleIcon, SignatureIcon } from "@/assets/icons";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { InvoiceImageType } from "@/types/common/invoice";
import EmptySection from "@/components/ui/icon-placeholder";
import type { IDBImage } from "@/types/indexdb/invoice";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import type { AuthUser } from "@/types/auth";
import { useParams } from "next/navigation";
import { R2_PUBLIC_URL } from "@/constants";
import { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";

interface InvoiceImageSelectorSheetProps {
  children: React.ReactNode;
  type: InvoiceImageType;
  isLoading?: boolean;
  idbImages: IDBImage[];
  serverImages: string[];
  user: AuthUser | undefined;
  onUrlChange: (url: string) => void;
  onBase64Change: (base64?: string) => void;
}

export const InvoiceImageSelectorSheet = ({
  children,
  type,
  isLoading = false,
  idbImages,
  serverImages,
  user,
  onUrlChange,
  onBase64Change,
}: InvoiceImageSelectorSheetProps) => {
  const params = useParams();
  const [sheetOpen, setSheetOpen] = useState(false);
  // New invoices follow the data sync preference; an existing server invoice
  // still requires a hosted image even after the user turns sync off.
  const requiresSyncedAsset = params?.type === "server" || !!user?.allowedSavingData;
  const canUpload = !requiresSyncedAsset || !!user?.allowedSavingData;
  const localImages = idbImages.filter((image) => image.type === type);
  const availableImages = [
    ...(user ? getImagesWithKey(serverImages, type) : []).map((image) => ({
      id: image,
      source: "server" as const,
      value: image,
      url: `${R2_PUBLIC_URL}/${image}`,
    })),
    ...(requiresSyncedAsset ? [] : localImages).map((image) => ({
      id: image.id,
      source: "local" as const,
      value: image.base64,
      url: image.base64,
    })),
  ];

  const handleImageSelect = (image: string, source: "server" | "local") => {
    if (source === "server") {
      onBase64Change(undefined);
      onUrlChange(`${R2_PUBLIC_URL}/${image}`);
    } else {
      const blob = createBlobFromBase64(image);
      if (!blob) {
        toast.error("This image couldn't be opened. Please upload it again.");
        return;
      }
      onBase64Change(image);
      onUrlChange(URL.createObjectURL(blob));
    }
    setSheetOpen(false);
  };

  return (
    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
      <SheetTrigger type="button" aria-label={`Select ${type}`}>
        {children}
      </SheetTrigger>
      <SheetContent className="scroll-bar-hidden w-[90%] !max-w-lg overflow-y-auto">
        <SheetHeader className="border-b pr-10">
          <SheetTitle>Select a {type}</SheetTitle>
          <SheetDescription>Choose an image for your invoice or add a new one.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 px-4 pb-4">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3" aria-label="Loading assets" role="status">
              <span className="sr-only">Loading your {type}s…</span>
              <Skeleton className="aspect-square rounded-xl" />
              <Skeleton className="aspect-square rounded-xl" />
            </div>
          ) : (
            <>
              <p className="text-muted-foreground text-xs">
                {user?.allowedSavingData
                  ? "New images are saved to your account with data sync."
                  : requiresSyncedAsset
                    ? "Enable data sync in Assets to add images to this invoice."
                    : "New images are saved on this device."}
              </p>
              {requiresSyncedAsset && localImages.length > 0 && (
                <Alert>
                  <AlertDescription>
                    This invoice uses synced images. To use an image saved on this device, upload it again with data
                    sync enabled.
                  </AlertDescription>
                </Alert>
              )}
              <div className="grid grid-cols-2 gap-3">
                {canUpload && (type === "logo" ? <UploadLogoAsset compact /> : <UploadSignatureAsset compact />)}
                {availableImages.map((image, index) => (
                  <button
                    type="button"
                    key={`${image.source}-${image.id}`}
                    className="border-border bg-muted/20 hover:border-primary/50 focus-visible:ring-ring flex min-h-[180px] cursor-pointer flex-col overflow-hidden rounded-xl border text-left outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    onClick={() => handleImageSelect(image.value, image.source)}
                    aria-label={`Use ${type} ${index + 1}, ${image.source === "server" ? "saved to account" : "on this device"}`}
                  >
                    <div className="flex min-h-0 w-full flex-1 items-center justify-center p-4">
                      <Image
                        src={image.url}
                        alt={`${type === "logo" ? "Logo" : "Signature"} ${index + 1}`}
                        width={200}
                        height={140}
                        className="h-28 w-full object-contain"
                        unoptimized
                      />
                    </div>
                    <div className="flex w-full items-center justify-between border-t px-3 py-2">
                      <span className="text-xs capitalize">
                        {type} {index + 1}
                      </span>
                      <Badge variant="secondary" size="xs">
                        {image.source === "server" ? "Synced" : "Device"}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
              {availableImages.length === 0 && (
                <EmptySection
                  className="py-6"
                  icon={type === "logo" ? ImageSparkleIcon : SignatureIcon}
                  title={`No ${type}s yet`}
                  description={
                    canUpload
                      ? `Add a ${type} above, then select it for your invoice.`
                      : "Turn on data sync in Assets to add an image."
                  }
                />
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
