export const getImagesWithKey = (images: R2Object[] | undefined, key: string) => {
  return images?.filter((image) => image.key.includes(key)) ?? [];
};
