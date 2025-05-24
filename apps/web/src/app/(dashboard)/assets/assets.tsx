"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImageSparkleIcon, SignatureIcon, TrashIcon } from "@/assets/icons";
import { getImagesWithKey } from "@/lib/manage-assets/getImagesWithKey";
import { deleteImageFromIDB } from "@/lib/indexdb-queries/deleteImage";
import { getAllImages } from "@/lib/indexdb-queries/getAllImages";
import EmptySection from "@/components/ui/icon-placeholder";
import UploadSignatureAsset from "./upload-signature.asset";
import { asyncTryCatch } from "@/lib/neverthrow/tryCatch";
import { R2_PUBLIC_URL } from "@/constants/strings";
import UploadLogoAsset from "./upload-logo-asset";
import { Button } from "@/components/ui/button";
import { useTRPC } from "@/trpc/client";
import { AuthUser } from "@/types/auth";
import Image from "next/image";
import { toast } from "sonner";
import React from "react";

const typeOfImages = [
  {
    key: "logo",
    icon: <ImageSparkleIcon />,
    title: "Logos",
    description:
      "Manage the logos that will be used in the invoices. You can upload a new logo or delete the existing one.",
  },
  {
    key: "signature",
    icon: <SignatureIcon />,
    title: "Signatures",
    description:
      "Manage the signatures that will be used in the invoices. You can upload a new signature or delete the existing one.",
  },
];

const AssetsPage = ({ user }: { user: AuthUser | undefined }) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const images = useQuery({
    ...trpc.cloudflare.listImages.queryOptions(),
    enabled: !!user,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  const imagesFromIndexedDB = useQuery({
    queryKey: ["idb-images"],
    queryFn: getAllImages,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  //   Delete image mutation
  const deleteImageMutation = useMutation({
    ...trpc.cloudflare.deleteImageFile.mutationOptions(),
    onSuccess: () => {
      toast.success("Success!", {
        description: "Image deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: trpc.cloudflare.listImages.queryKey() });
    },
    onError: (error) => {
      toast.error("Error Occurred!", {
        description: `Failed to delete image: ${error.message}`,
      });
    },
  });

  if (images.isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptySection title="Loading Assets" description="Please wait while we load the assets" />
      </div>
    );
  }

  if (images.isError) {
    return (
      <div className="flex h-full items-center justify-center text-red-500">
        <EmptySection title="Error Occured!" description={`Error while fetching assets! ${images.failureReason}`} />
      </div>
    );
  }

  const handleDeleteImage = async (imageId: string, type: "server" | "local") => {
    if (user && type === "server") {
      // Delete image from  server
      deleteImageMutation.mutate({ key: imageId });
    } else {
      const { success } = await asyncTryCatch(deleteImageFromIDB(imageId));

      if (!success) {
        toast.error("Error Occurred!", {
          description: "Failed to delete image",
        });
      } else {
        toast.success("Success!", {
          description: "Image deleted successfully",
        });
        queryClient.invalidateQueries({ queryKey: ["idb-images"] });
      }
    }
  };

  return (
    <div>
      <Accordion
        type="multiple"
        defaultValue={[typeOfImages[0].key, typeOfImages[1].key]}
        className="w-full divide-y border-b"
      >
        {typeOfImages.map((type) => (
          <AccordionItem key={type.key} value={type.key}>
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                {type.icon}
                <span>{type.title}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              {user && (
                <>
                  <div>
                    <div className="instrument-serif text-xl font-bold">Server {type.title}</div>
                    <p className="text-muted-foreground text-xs">
                      Manage the {type.key}s that are stored on the server.
                    </p>
                  </div>
                  {/* List Images */}
                  <div className="mt-2 grid grid-cols-2 gap-4 md:grid-cols-5">
                    {type.key === "logo" && <UploadLogoAsset type="server" />}
                    {type.key === "signature" && <UploadSignatureAsset type="server" />}
                    {getImagesWithKey(images.data?.images ?? [], type.key).map((image) => (
                      <div key={image.Key} className="bg-border/30 relative rounded-md">
                        <Button
                          disabled={deleteImageMutation.isPending}
                          variant="ghost"
                          size="xs"
                          className="absolute top-2 right-2 !px-0.5 text-red-500 hover:!bg-red-500 hover:!text-white"
                          onClick={() => handleDeleteImage(image.Key ?? "", "server")}
                        >
                          <TrashIcon />
                        </Button>
                        <Image
                          src={`${R2_PUBLIC_URL}/${image.Key}`}
                          alt={image.Key ?? "Image"}
                          width={200}
                          height={200}
                          className="aspect-square w-full rounded-md object-cover"
                          unoptimized
                        />
                      </div>
                    ))}
                  </div>
                </>
              )}
              <div>
                <div className="instrument-serif text-xl font-bold">Local {type.title}</div>
                <p className="text-muted-foreground text-xs">Manage the {type.key}s that are stored on your device.</p>
              </div>
              {/* List Images */}
              <div className="mt-2 grid grid-cols-2 gap-4 md:grid-cols-5">
                {type.key === "logo" && <UploadLogoAsset type="local" />}
                {type.key === "signature" && <UploadSignatureAsset type="local" />}
                {imagesFromIndexedDB.data?.map((image) => {
                  if (image.type === type.key) {
                    return (
                      <div key={image.id} className="bg-border/30 relative rounded-md">
                        <Button
                          variant="ghost"
                          size="xs"
                          className="absolute top-2 right-2 !px-0.5 text-red-500 hover:!bg-red-500 hover:!text-white"
                          onClick={() => handleDeleteImage(image.id, "local")}
                        >
                          <TrashIcon />
                        </Button>
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
                  }
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default AssetsPage;
