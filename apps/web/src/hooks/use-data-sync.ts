"use client";

import { useIsMutating, useMutation } from "@tanstack/react-query";
import { clientAuth, useSession } from "@/lib/client-auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export const DATA_SYNC_MUTATION_KEY = ["data-sync-preference"];

export function useDataSync() {
  const { data: session, isPending: isSessionPending, error: sessionError, refetch } = useSession();
  const router = useRouter();
  const pendingUpdates = useIsMutating({ mutationKey: DATA_SYNC_MUTATION_KEY });
  const update = useMutation({
    mutationKey: DATA_SYNC_MUTATION_KEY,
    mutationFn: async (allowedSavingData: boolean) => {
      const result = await clientAuth.updateUser({ allowedSavingData });
      if (result.error) {
        throw new Error(result.error.message || "Could not update data sync. Please try again.");
      }
      await refetch();
      router.refresh();
    },
    onError: (error) => toast.error("Could not update data sync", { description: error.message }),
  });

  return {
    session,
    isSessionPending,
    sessionError,
    retrySession: refetch,
    isSyncEnabled: !!session?.user.allowedSavingData,
    isUpdating: pendingUpdates > 0,
    setDataSync: update.mutate,
  };
}
