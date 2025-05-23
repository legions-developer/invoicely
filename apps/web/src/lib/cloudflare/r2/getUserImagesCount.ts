import { ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import { env } from "@invoicely/utilities";

export const getUserImagesCount = async (s3: S3Client, userId: string) => {
  const listObjectsV2Command = new ListObjectsV2Command({
    Bucket: env.CF_R2_BUCKET_NAME,
    Prefix: `${userId}/`,
  });

  const response = await s3.send(listObjectsV2Command);

  return response.Contents?.length ?? 0;
};
