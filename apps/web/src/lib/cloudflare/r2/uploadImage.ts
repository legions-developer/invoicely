import { createBlobFromBase64 } from "@/lib/invoice/create-blob-from-base64";
import { getImageMimeType } from "@/lib/invoice/get-image-mime";
import { InvoiceImageType } from "@/types/common/invoice";
import { v4 as uuidv4 } from "uuid";

export const uploadImage = async (env: CloudflareEnv, base64: string, userId: string, imageType: InvoiceImageType) => {
  const contentType = getImageMimeType(base64);
  const imageBlob = createBlobFromBase64(base64);

  if (!contentType || !imageBlob) {
    return null;
  }

  const imageKey = `${userId}/${imageType}-${uuidv4()}`;

  try {
    await env.R2_IMAGES.put(imageKey, imageBlob, {
      httpMetadata: {
        contentType,
      },
      customMetadata: {
        userId,
        imageType,
      },
    });
    return imageKey;
  } catch {
    return null;
  }
};
