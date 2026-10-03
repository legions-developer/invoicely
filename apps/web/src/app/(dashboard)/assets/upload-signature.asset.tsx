"use client";

import SignatureInputModal from "@/components/ui/image/signature-input-modal";
import { useAssetUpload } from "@/hooks/use-asset-upload";

interface UploadSignatureAssetProps {
  disableIcon?: boolean;
  compact?: boolean;
  className?: string;
}

export default function UploadSignatureAsset({
  disableIcon = false,
  compact = false,
  className,
}: UploadSignatureAssetProps) {
  const { uploadAsset, isLoading, loadingLabel } = useAssetUpload("signature");

  return (
    <SignatureInputModal
      title="Draw a signature"
      className={className}
      compact={compact}
      isLoading={isLoading}
      loadingLabel={loadingLabel}
      allowPreview={false}
      onBase64Change={uploadAsset}
      maxSizeMB={0.15}
      disableIcon={disableIcon}
    />
  );
}
