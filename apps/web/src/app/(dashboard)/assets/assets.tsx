"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { getImagesWithKey } from "@/lib/manage-assets/getImagesWithKey";
import { ImageSparkleIcon, SignatureIcon } from "@/assets/icons";
import EmptySection from "@/components/ui/icon-placeholder";
import UploadSignatureAsset from "./upload-signature.asset";
import { R2_PUBLIC_URL } from "@/constants/strings";
import UploadLogoAsset from "./upload-logo-asset";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import Image from "next/image";
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

const AssetsPage = () => {
  const trpc = useTRPC();

  const images = useQuery(trpc.cloudflare.listImages.queryOptions());

  if (images.isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptySection title="Loading Assets" description="Please wait while we load the assets" />
      </div>
    );
  }

  if (images.isError || !images.data) {
    return (
      <div className="flex h-full items-center justify-center text-red-500">
        <EmptySection title="Error Occured!" description={`Error while fetching assets! ${images.failureReason}`} />
      </div>
    );
  }

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
              <div>
                <div className="instrument-serif text-xl font-bold">Manage {type.title}</div>
                <p className="text-muted-foreground text-xs">{type.description}</p>
              </div>
              {/* List Images */}
              <div className="mt-2 grid grid-cols-2 gap-4 md:grid-cols-5">
                {type.key === "logo" && <UploadLogoAsset />}
                {type.key === "signature" && <UploadSignatureAsset />}
                {getImagesWithKey(images.data.images, type.key).map((image) => (
                  <div key={image.Key} className="bg-border/30 relative rounded-md">
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
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default AssetsPage;
