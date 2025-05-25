import { InvoiceImageType } from "@/types/common/invoice";
import { IDB_IMAGES } from "@/constants/indexed-db";
import { initIndexedDB } from "@/global/indexdb";
import { v4 as uuidv4 } from "uuid";

export const uploadImage = async (base64: string, type: InvoiceImageType) => {
  const db = await initIndexedDB();

  const id = uuidv4();

  // Now we will reupdate the invoice with the new status
  await db.put(IDB_IMAGES, {
    id: id,
    type: type,
    createdAt: new Date(),
    base64: base64,
  });
};
