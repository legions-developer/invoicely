import { DeleteObjectCommand, type S3Client } from "@aws-sdk/client-s3";
import { env } from "@invoicely/utilities";

export const deleteImage = async (s3: S3Client, key: string) => {
  const deleteImageResult = await s3.send(
    new DeleteObjectCommand({
      Bucket: env.CF_R2_BUCKET_NAME,
      Key: key,
    }),
  );

  if (deleteImageResult.$metadata.httpStatusCode === 204) {
    return true;
  }

  return false;
};
