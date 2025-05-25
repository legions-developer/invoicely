import { uploadImage as uploadImageToIndexedDB } from "@/lib/indexdb-queries/uploadImage";
import SignatureInputModal from "@/components/ui/image/signature-input-modal";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "@/constants/issues";
import type { InvoiceTypeType } from "@invoicely/db/schema/invoice";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { asyncTryCatch } from "@/lib/neverthrow/tryCatch";
import { useSession } from "@/lib/client-auth";
import { useTRPC } from "@/trpc/client";
import { toast } from "sonner";
import React from "react";

const UploadSignatureAsset = ({ disableIcon = false, type }: { disableIcon?: boolean; type: InvoiceTypeType }) => {
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
        type: "signature",
        base64: base64,
      });
    } else {
      // Upload images to indexedDB
      const { success, error } = await asyncTryCatch(uploadImageToIndexedDB(base64, "signature"));

      if (!success) {
        toast.error(ERROR_MESSAGES.TOAST_DEFAULT_TITLE, {
          description: `${ERROR_MESSAGES.UPLOADING_IMAGE}: ${error.message}`,
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
    <SignatureInputModal
      isLoading={uploadImage.isPending}
      onBase64Change={handleBase64Change}
      maxSizeMB={0.15}
      disableIcon={disableIcon}
    />
  );
};

export default UploadSignatureAsset;
