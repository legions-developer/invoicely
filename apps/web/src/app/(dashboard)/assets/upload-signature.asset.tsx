import SignatureInputModal from "@/components/ui/image/signature-input-modal";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { toast } from "sonner";
import React from "react";

const UploadSignatureAsset = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const uploadImage = useMutation({
    ...trpc.cloudflare.uploadImageFile.mutationOptions(),
    onSuccess: () => {
      toast.success("Success!", {
        description: "Signature uploaded successfully",
      });

      queryClient.invalidateQueries({ queryKey: trpc.cloudflare.listImages.queryKey() });
    },
    onError: (error) => {
      toast.error("Error Occurred!", {
        description: `Failed to upload image: ${error.message}`,
      });
    },
  });

  const handleBase64Change = (base64: string | undefined) => {
    if (!base64) return;

    uploadImage.mutate({
      type: "signature",
      base64: base64,
    });
  };

  return (
    <div>
      <SignatureInputModal isLoading={uploadImage.isPending} onBase64Change={handleBase64Change} />
    </div>
  );
};

export default UploadSignatureAsset;
