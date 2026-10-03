"use client";

import { uploadImage as uploadImageToIndexedDB } from "@/lib/indexdb-queries/uploadImage";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { InvoiceImageType } from "@/types/common/invoice";
import { useTRPC, useTRPCClient } from "@/trpc/client";
import { useDataSync } from "@/hooks/use-data-sync";
import { toast } from "sonner";
import { useRef } from "react";

export function useAssetUpload(type: InvoiceImageType) {
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();
  const queryClient = useQueryClient();
  const { isSessionPending, isSyncEnabled, isUpdating, sessionError } = useDataSync();
  const inFlight = useRef(false);

  const upload = useMutation({
    mutationKey: ["asset-upload", type],
    mutationFn: async ({ base64, sync }: { base64: string; sync: boolean }) => {
      if (sync) {
        await trpcClient.cloudflare.uploadImageFile.mutate({ type, base64 });
      } else {
        await uploadImageToIndexedDB(base64, type);
      }
    },
    onSuccess: async (_, { sync }) => {
      await queryClient.invalidateQueries({
        queryKey: sync ? trpc.cloudflare.listImages.queryKey() : ["idb-images"],
      });
      toast.success(type === "logo" ? "Logo added" : "Signature added", {
        description: sync ? "Saved to your account." : "Saved on this device.",
      });
    },
    onError: (error) => {
      toast.error(`Couldn't save your ${type}`, { description: error.message });
    },
  });

  const uploadAsset = async (base64: string | undefined) => {
    if (!base64) return;
    if (sessionError) throw new Error("Your storage preference is unavailable. Please retry loading your account.");
    if (isSessionPending || isUpdating) throw new Error("Please wait while your sync setting is updated.");
    if (inFlight.current) throw new Error("An upload is already in progress.");

    inFlight.current = true;
    try {
      await upload.mutateAsync({ base64, sync: isSyncEnabled });
    } finally {
      inFlight.current = false;
    }
  };

  return {
    uploadAsset,
    isLoading: !!sessionError || isSessionPending || isUpdating || upload.isPending,
    loadingLabel: sessionError
      ? "Storage unavailable"
      : isSessionPending || isUpdating
        ? "Checking sync settings…"
        : "Saving…",
  };
}
