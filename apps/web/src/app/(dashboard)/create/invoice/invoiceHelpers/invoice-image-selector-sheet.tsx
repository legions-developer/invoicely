"use client";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import UploadSignatureAsset from "@/app/(dashboard)/assets/upload-signature.asset";
import { createBlobFromBase64 } from "@/lib/invoice/create-blob-from-base64";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import UploadLogoAsset from "@/app/(dashboard)/assets/upload-logo-asset";
import { getImagesWithKey } from "@/lib/manage-assets/getImagesWithKey";
import EmptySection from "@/components/ui/icon-placeholder";
import { R2_PUBLIC_URL } from "@/constants/strings";
import { IDBImage } from "@/types/indexdb/invoice";
import type { _Object } from "@aws-sdk/client-s3";
import { useParams } from "next/navigation";
import { useState } from "react";
import Image from "next/image";

interface InvoiceImageSelectorSheetProps {
  children: React.ReactNode;
  type: "logo" | "signature";
  isLoading?: boolean;
  idbImages: IDBImage[];
  serverImages: _Object[];
  onUrlChange: (url: string) => void;
  onBase64Change: (base64?: string) => void;
}

export const InvoiceImageSelectorSheet = ({
  children,
  type,
  isLoading = false,
  idbImages,
  serverImages,
  onUrlChange,
  onBase64Change,
}: InvoiceImageSelectorSheetProps) => {
  const params = useParams();
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleImageSelect = (image: string, type: "server" | "local") => {
    if (type === "server") {
      onUrlChange(`${R2_PUBLIC_URL}/${image}`);
      setSheetOpen(false);
    } else {
      onBase64Change(image);
      // convert base64 to url
      const blob = createBlobFromBase64(image);
      if (!blob) return;
      onUrlChange(URL.createObjectURL(blob));
      setSheetOpen(false);
    }
  };

  return (
    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
      <SheetTrigger>{children}</SheetTrigger>
      <SheetContent className="scroll-bar-hidden w-[90%] !max-w-lg overflow-y-scroll">
        <SheetHeader className="hidden flex-col gap-0">
          <SheetTitle>Select {type}</SheetTitle>
          <SheetDescription>Select an image from your assets</SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="flex h-full w-full items-center justify-center">
            <EmptySection title="Loading..." description="Please wait while we load the images." />
          </div>
        ) : (
          <div className="flex flex-col gap-4 p-4">
            <div className="flex flex-col gap-4">
              <div>
                <div className="instrument-serif text-xl font-bold">Server {type}</div>
                <p className="text-muted-foreground text-xs">
                  Click to select the {type}s that are stored on your device.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {type === "logo" && <UploadLogoAsset disableIcon type="server" />}
                {type === "signature" && <UploadSignatureAsset disableIcon type="server" />}
                {getImagesWithKey(serverImages, type).map((image) => (
                  <div
                    key={image.Key}
                    className="bg-border/30 relative cursor-pointer rounded-md"
                    onClick={() => handleImageSelect(image.Key ?? "", "server")}
                  >
                    <Image
                      src={`${R2_PUBLIC_URL}/${image.Key}`}
                      alt={image.Key ?? "Image"}
                      width={200}
                      height={200}
                      className="aspect-square w-full rounded-md border object-cover"
                      unoptimized
                    />
                  </div>
                ))}
              </div>
            </div>
            {/* Dont display local images if the invoice type is server */}
            {params?.type !== "server" && (
              <div className="flex flex-col gap-4">
                <div>
                  <div className="instrument-serif text-xl font-bold">Local {type}</div>
                  <p className="text-muted-foreground text-xs">
                    Click to select the {type}s that are stored on your device.
                  </p>
                </div>
                <Alert variant="destructive">
                  <AlertTitle>Caution</AlertTitle>
                  <AlertDescription>
                    Don&apos;t select local {type} if you are using server invoice storage. {type} will not be saved in
                    your invoice.
                  </AlertDescription>
                </Alert>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                  {type === "logo" && <UploadLogoAsset disableIcon type="local" />}
                  {type === "signature" && <UploadSignatureAsset disableIcon type="local" />}
                  {idbImages.map((image) => {
                    if (image.type !== type) return null;

                    return (
                      <div
                        key={image.id}
                        className="bg-border/30 relative cursor-pointer rounded-md"
                        onClick={() => handleImageSelect(image.base64, "local")}
                      >
                        <Image
                          src={image.base64}
                          alt={image.id}
                          width={200}
                          height={200}
                          className="aspect-square w-full rounded-md object-cover"
                          unoptimized
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
