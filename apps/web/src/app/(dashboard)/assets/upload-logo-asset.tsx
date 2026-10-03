"use client";

import { uploadImage as uploadImageToIndexedDB } from "@/lib/indexdb-queries/uploadImage";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "@/constants/issues";
import type { InvoiceTypeType } from "@invoicely/db/schema/invoice";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import ImageInput from "@/components/ui/image/image-input";
import { asyncTryCatch } from "@/lib/neverthrow/tryCatch";
import { useSession } from "@/lib/client-auth";
import { useTRPC } from "@/trpc/client";
import { toast } from "sonner";
import React from "react";

const UploadLogoAsset = ({ disableIcon = false, type }: { disableIcon?: boolean; type: InvoiceTypeType }) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  const uploadImage = useMutation({
    ...trpc.cloudflare.uploadImageFile.mutationOptions(),
    onSuccess: () => {
      toast.success(SUCCESS_MESSAGES.TOAST_DEFAULT_TITLE, {
        description: SUCCESS_MESSAGES.IMAGE_UPLOADED,
      });

      queryClient.invalidateQueries({ queryKey: trpc.cloudflare.listImages.queryKey() });
    },
    onError: (error) => {
      toast.error(ERROR_MESSAGES.TOAST_DEFAULT_TITLE, {
        description: `${ERROR_MESSAGES.UPLOADING_IMAGE}: ${error.message}`,
      });
    },
  });

  const handleBase64Change = async (base64: string | undefined) => {
    if (!base64) return;

    if (type === "server" && session && session.user.allowedSavingData) {
      uploadImage.mutate({
        type: "logo",
        base64: base64,
      });
    } else {
      // Upload images to indexedDB
      const { success } = await asyncTryCatch(uploadImageToIndexedDB(base64, "logo"));

      if (!success) {
        toast.error(ERROR_MESSAGES.TOAST_DEFAULT_TITLE, {
          description: ERROR_MESSAGES.UPLOADING_IMAGE,
        });
      } else {
        toast.success(SUCCESS_MESSAGES.TOAST_DEFAULT_TITLE, {
          description: SUCCESS_MESSAGES.IMAGE_UPLOADED,
        });
        queryClient.invalidateQueries({ queryKey: ["idb-images"] });
      }
    }
  };

  return (
    <ImageInput
      isLoading={uploadImage.isPending}
      allowPreview={false}
      onBase64Change={handleBase64Change}
      maxSizeMB={0.4}
      disableIcon={disableIcon}
    />
  );
};

export default UploadLogoAsset;
