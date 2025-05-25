import { createBufferFromBase64 } from "@/lib/invoice/create-buffer-from-base64";
import { PutObjectCommand, type S3Client } from "@aws-sdk/client-s3";
import { getImageMimeType } from "@/lib/invoice/get-image-mime";
import { InvoiceImageType } from "@/types/common/invoice";
import { env } from "@invoicely/utilities";
import { v4 as uuidv4 } from "uuid";

export const uploadImage = async (s3: S3Client, base64: string, userId: string, imageType: InvoiceImageType) => {
  const imageBuffer = createBufferFromBase64(base64);
  const contentType = getImageMimeType(base64);

  if (!contentType) {
    return null;
  }

  const imageKey = `${userId}/${imageType}-${uuidv4()}`;

  const imageUploadResult = await s3.send(
    new PutObjectCommand({
      Bucket: env.CF_R2_BUCKET_NAME,
      Key: imageKey,
      ContentType: contentType,
      Body: imageBuffer,
    }),
  );

  if (imageUploadResult.$metadata.httpStatusCode === 200) {
    return `${env.CF_R2_PUBLIC_DOMAIN}/${imageKey}`;
  }

  return null;
};
