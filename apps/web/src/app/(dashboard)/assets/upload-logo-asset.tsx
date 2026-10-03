"use client";

import ImageInput from "@/components/ui/image/image-input";
import { useAssetUpload } from "@/hooks/use-asset-upload";

interface UploadLogoAssetProps {
  disableIcon?: boolean;
  compact?: boolean;
  className?: string;
}

export default function UploadLogoAsset({ disableIcon = false, compact = false, className }: UploadLogoAssetProps) {
  const { uploadAsset, isLoading, loadingLabel } = useAssetUpload("logo");

  return (
    <ImageInput
      title="Add a logo"
      className={className}
      compact={compact}
      isLoading={isLoading}
      loadingLabel={loadingLabel}
      allowPreview={false}
      onBase64Change={uploadAsset}
      maxSizeMB={0.4}
      disableIcon={disableIcon}
    />
  );
}
