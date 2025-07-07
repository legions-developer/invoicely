/**
 * Filters an array of image paths to return only those that include a specific key
 *
 * @param {string[] | undefined} images - Array of image paths to filter, or undefined
 * @param {string} key - The key to filter images by (e.g., "logo", "signature")
 * @returns {string[]} - Filtered array of image paths containing the key
 */
export const getImagesWithKey = (images: string[] | undefined, key: string) => {
  // If images is undefined, return an empty array
  if (!images) return [];

  return images.filter((image) => image.includes(key));
};
