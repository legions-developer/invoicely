import { IDB_IMAGES } from "@/constants/indexed-db";
import { IDBImage } from "@/types/indexdb/invoice";
import { initIndexedDB } from "@/global/indexdb";

export const getAllImages = async (): Promise<IDBImage[]> => {
  const db = await initIndexedDB();
  return await db.getAll(IDB_IMAGES);
};
