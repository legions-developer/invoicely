import { IDB_IMAGES } from "@/constants/indexed-db";
import { initIndexedDB } from "@/global/indexdb";

/**
 * Delete an image from the IndexedDB
 * @param imageId - The ID of the image to delete
 * @returns {Promise<void>}
 */
export const deleteImageFromIDB = async (imageId: string): Promise<void> => {
  const db = await initIndexedDB();
  await db.delete(IDB_IMAGES, imageId);
};
