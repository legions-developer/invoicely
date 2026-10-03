"use client";

import {
  Dialog,
  DialogContent,
  DialogContentContainer,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogHeaderContainer,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertCircle, Cloud, HardDrive, ImagePlus, PenLine, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getImagesWithKey } from "@/lib/manage-assets/getImagesWithKey";
import { deleteImageFromIDB } from "@/lib/indexdb-queries/deleteImage";
import { getAllImages } from "@/lib/indexdb-queries/getAllImages";
import UploadSignatureAsset from "./upload-signature.asset";
import { Skeleton } from "@/components/ui/skeleton";
import { useDataSync } from "@/hooks/use-data-sync";
import { DefaultDetails } from "./default-details";
import UploadLogoAsset from "./upload-logo-asset";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { R2_PUBLIC_URL } from "@/constants";
import { useRef, useState } from "react";
import { useTRPC } from "@/trpc/client";
import Image from "next/image";
import { toast } from "sonner";

interface LibraryAsset {
  id: string;
  src: string;
  type: "logo" | "signature";
  storage: "server" | "local";
}

const collections = [
  {
    type: "logo",
    title: "Logos",
    description: "A familiar mark on every invoice.",
    emptyTitle: "Give your invoices an identity",
    emptyDescription: "Add your business logo, then choose it when you create an invoice.",
    icon: ImagePlus,
  },
  {
    type: "signature",
    title: "Signatures",
    description: "The finishing touch, ready to reuse.",
    emptyTitle: "Make it yours",
    emptyDescription: "Draw a signature or upload one to add a personal sign-off.",
    icon: PenLine,
  },
] as const;

const AssetsPage = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { session, isSessionPending, sessionError, retrySession, isSyncEnabled, isUpdating, setDataSync } =
    useDataSync();
  const [assetToDelete, setAssetToDelete] = useState<LibraryAsset | null>(null);
  const deleteTriggerRef = useRef<HTMLButtonElement | null>(null);
  const libraryHeadingRef = useRef<HTMLHeadingElement | null>(null);

  // Existing account assets remain available even when new uploads are local.
  const serverImages = useQuery({
    ...trpc.cloudflare.listImages.queryOptions(),
    enabled: !!session?.user,
  });
  const localImages = useQuery({ queryKey: ["idb-images"], queryFn: getAllImages });

  const onDeleteError = (error: { message: string }) =>
    toast.error("Could not remove image", { description: error.message });
  const deleteServerImage = useMutation({
    ...trpc.cloudflare.deleteImageFile.mutationOptions(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: trpc.cloudflare.listImages.queryKey() });
      setAssetToDelete(null);
      toast.success("Image removed");
    },
    onError: (error) => onDeleteError(error),
  });
  const deleteLocalImage = useMutation({
    mutationFn: deleteImageFromIDB,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["idb-images"] });
      setAssetToDelete(null);
      toast.success("Image removed");
    },
    onError: (error) => onDeleteError(error),
  });
  const isDeleting = deleteServerImage.isPending || deleteLocalImage.isPending;
  const isLoading = isSessionPending || serverImages.isLoading || localImages.isLoading;
  const hasLoadError = (!!session && serverImages.isError) || localImages.isError;

  const removeAsset = () => {
    if (!assetToDelete || isDeleting) return;
    if (assetToDelete.storage === "server") {
      deleteServerImage.mutate({ key: assetToDelete.id });
    } else {
      deleteLocalImage.mutate(assetToDelete.id);
    }
  };

  return (
    <div className="[&_button:focus-visible]:ring-ring [&_button:focus-visible]:ring-offset-background mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-7 [--muted-foreground:color-mix(in_oklch,var(--foreground)_70%,var(--background))] sm:px-7 sm:py-10 lg:gap-10 lg:px-10 [&_button:focus-visible]:ring-2 [&_button:focus-visible]:ring-offset-2">
      <header className="flex flex-col gap-3">
        <p className="text-primary text-xs font-medium tracking-[0.16em] uppercase">Your workspace</p>
        <h1 className="instrument-serif text-4xl tracking-tight sm:text-5xl">Assets &amp; defaults</h1>
        <p className="text-muted-foreground max-w-xl text-sm leading-relaxed">
          A little setup. A lot less repetition. Keep your branding and go-to details ready for every invoice.
        </p>
      </header>

      <section
        aria-label="Asset storage"
        className="bg-card flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
      >
        <div className="flex items-start gap-3">
          <div
            className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg"
            aria-hidden="true"
          >
            {isSyncEnabled ? <Cloud className="size-5" /> : <HardDrive className="size-5" />}
          </div>
          <div className="flex flex-col gap-1" aria-live="polite">
            <p className="text-sm font-medium">
              {sessionError
                ? "Your storage preference is unavailable"
                : isSessionPending
                  ? "Checking your storage preference…"
                  : isSyncEnabled
                    ? "New uploads sync to your account"
                    : "New uploads stay on this device"}
            </p>
            <p id="asset-sync-description" className="text-muted-foreground max-w-lg text-xs leading-relaxed">
              {sessionError
                ? "Uploads are paused until we can confirm where to save them."
                : isSyncEnabled
                  ? "Your new logos and signatures will be available across devices."
                  : session
                    ? "Logos and signatures are saved in this browser. Enable data sync to save new uploads to your account."
                    : "Logos and signatures are saved in this browser. Sign in to enable data sync across devices."}{" "}
              Existing files stay where they are.
            </p>
          </div>
        </div>
        {session ? (
          <div className="flex shrink-0 items-center gap-3 self-end sm:self-auto">
            <label htmlFor="asset-data-sync" className="cursor-pointer text-xs font-medium">
              {isUpdating ? "Updating…" : "Allow data sync"}
            </label>
            <Switch
              id="asset-data-sync"
              aria-describedby="asset-sync-description"
              checked={isSyncEnabled}
              disabled={isUpdating || isSessionPending || !!sessionError}
              onCheckedChange={setDataSync}
            />
          </div>
        ) : !isSessionPending ? (
          <Badge variant="outline">
            <HardDrive aria-hidden="true" /> This device
          </Badge>
        ) : (
          <Skeleton className="h-6 w-28 shrink-0" />
        )}
      </section>

      {sessionError && (
        <AssetLoadError
          title="Couldn’t check your sync setting"
          description="Try again before adding new images."
          retry={() => retrySession()}
          busy={isSessionPending}
        />
      )}

      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 ref={libraryHeadingRef} tabIndex={-1} className="text-base font-semibold tracking-tight">
            Brand assets
          </h2>
          <p className="text-muted-foreground text-xs">Choose these when creating an invoice</p>
        </div>
        {session && serverImages.isError && (
          <AssetLoadError
            title="Account images couldn’t be loaded"
            description="Your device images are still available."
            retry={() => serverImages.refetch()}
            busy={serverImages.isFetching}
          />
        )}
        {localImages.isError && (
          <AssetLoadError
            title="Device images couldn’t be loaded"
            description="Check that this browser allows local storage, then try again."
            retry={() => localImages.refetch()}
            busy={localImages.isFetching}
          />
        )}
        <div className="grid items-start gap-5 xl:grid-cols-2">
          {collections.map((collection) => {
            const assets: LibraryAsset[] = [
              ...(session
                ? getImagesWithKey(serverImages.data?.images, collection.type).map((id) => ({
                    id,
                    src: `${R2_PUBLIC_URL}/${id}`,
                    type: collection.type,
                    storage: "server" as const,
                  }))
                : []),
              ...(localImages.data ?? [])
                .filter((asset) => asset.type === collection.type)
                .map((asset) => ({
                  id: asset.id,
                  src: asset.base64,
                  type: collection.type,
                  storage: "local" as const,
                })),
            ];
            return (
              <section
                key={collection.type}
                aria-labelledby={`${collection.type}-heading`}
                className="flex min-w-0 flex-col gap-5 rounded-xl border p-4 sm:p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3">
                    <collection.icon className="text-muted-foreground mt-0.5 size-5" aria-hidden="true" />
                    <div className="flex flex-col gap-1">
                      <h3 id={`${collection.type}-heading`} className="text-sm font-semibold">
                        {collection.title}
                      </h3>
                      <p className="text-muted-foreground text-xs leading-relaxed">{collection.description}</p>
                    </div>
                  </div>
                  <Badge variant="secondary">{assets.length} saved</Badge>
                </div>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,160px),1fr))] gap-3">
                  {collection.type === "logo" ? <UploadLogoAsset compact /> : <UploadSignatureAsset compact />}
                  {assets.map((asset, index) => (
                    <div key={`${asset.storage}-${asset.id}`} className="bg-card overflow-hidden rounded-lg border">
                      <div
                        className="bg-muted/40 flex h-32 items-center justify-center p-4"
                        style={{
                          backgroundImage: "repeating-conic-gradient(var(--border) 0% 25%, transparent 0% 50%)",
                          backgroundSize: "16px 16px",
                        }}
                      >
                        <Image
                          src={asset.src}
                          alt={`${collection.title.slice(0, -1)} ${index + 1}`}
                          width={200}
                          height={128}
                          className="h-full w-full object-contain"
                          unoptimized
                        />
                      </div>
                      <div className="flex min-h-12 items-center justify-between gap-1 border-t px-3 py-2">
                        <span className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
                          {asset.storage === "server" ? (
                            <Cloud className="size-3" aria-hidden="true" />
                          ) : (
                            <HardDrive className="size-3" aria-hidden="true" />
                          )}
                          {asset.storage === "server" ? "Synced" : "This device"}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Remove ${collection.type} ${index + 1}`}
                          onClick={(event) => {
                            deleteTriggerRef.current = event.currentTarget;
                            setAssetToDelete(asset);
                          }}
                          disabled={isDeleting}
                        >
                          <Trash2 aria-hidden="true" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {isLoading && <Skeleton className="h-[180px] rounded-lg" />}
                  {!isLoading && !hasLoadError && assets.length === 0 && (
                    <div className="flex flex-col justify-center gap-2 px-3 py-3">
                      <p className="text-sm font-medium">{collection.emptyTitle}</p>
                      <p className="text-muted-foreground text-xs leading-relaxed">{collection.emptyDescription}</p>
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      <section aria-labelledby="invoice-defaults-heading" className="flex flex-col gap-6 rounded-xl border p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1.5">
            <h2 id="invoice-defaults-heading" className="text-base font-semibold tracking-tight">
              Invoice defaults
            </h2>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Start new invoices with your details already filled in. You can always edit them later.
            </p>
          </div>
          <Badge variant="outline">
            <HardDrive aria-hidden="true" /> Saved on this device
          </Badge>
        </div>
        <DefaultDetails />
      </section>

      <Dialog
        open={!!assetToDelete}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setAssetToDelete(null);
        }}
      >
        <DialogContent
          hideCloseButton={isDeleting}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            const target = deleteTriggerRef.current;
            if (target?.isConnected) target.focus();
            else libraryHeadingRef.current?.focus();
          }}
        >
          <DialogHeaderContainer>
            <DialogHeader>
              <DialogTitle>Remove this {assetToDelete?.type}?</DialogTitle>
              <DialogDescription>You can upload it again whenever you need it.</DialogDescription>
            </DialogHeader>
          </DialogHeaderContainer>
          <DialogContentContainer>
            {assetToDelete && (
              <Image
                src={assetToDelete.src}
                alt={`Selected ${assetToDelete.type}`}
                width={200}
                height={120}
                className="bg-muted h-32 w-full rounded-md object-contain p-4"
                unoptimized
              />
            )}
            <p className="text-muted-foreground text-sm leading-relaxed">
              {assetToDelete?.storage === "server"
                ? "This removes the file from your account. Invoices that link to this file may no longer display it."
                : "This removes the image from this device’s library."}
            </p>
          </DialogContentContainer>
          <DialogFooter>
            <Button variant="outline" disabled={isDeleting} onClick={() => setAssetToDelete(null)}>
              Keep it
            </Button>
            <Button variant="destructive" disabled={isDeleting} onClick={removeAsset}>
              {isDeleting ? "Removing…" : "Remove image"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

function AssetLoadError({
  title,
  description,
  retry,
  busy,
}: {
  title: string;
  description: string;
  retry: () => unknown;
  busy: boolean;
}) {
  return (
    <Alert variant="destructive">
      <AlertCircle aria-hidden="true" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        <p>{description}</p>
        <Button variant="outline" size="sm" disabled={busy} onClick={retry}>
          {busy ? "Retrying…" : "Try again"}
        </Button>
      </AlertDescription>
    </Alert>
  );
}

export default AssetsPage;
