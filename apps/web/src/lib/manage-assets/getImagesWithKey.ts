export const getImagesWithKey = (images: string[] | undefined, key: string) => {
  return images?.filter((image) => image.includes(key)) ?? [];
};
