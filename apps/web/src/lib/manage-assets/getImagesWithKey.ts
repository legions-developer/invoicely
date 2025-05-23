import type { _Object } from "@aws-sdk/client-s3";

export const getImagesWithKey = (images: _Object[], key: string) => {
  return images.filter((image) => image.Key?.includes(key));
};
