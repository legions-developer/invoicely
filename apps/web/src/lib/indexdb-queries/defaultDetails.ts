import { IDB_DEFAULT_DETAILS, IDB_DEFAULT_DETAILS_KEY } from "@/constants/indexed-db";
import { ZodDefaultDetailsSchema } from "@/zod-schemas/invoice/default-details";
import { IDBDefaultDetails } from "@/types/indexdb/invoice";
import { initIndexedDB } from "@/global/indexdb";

export const getDefaultDetails = async (): Promise<IDBDefaultDetails | undefined> => {
  const db = await initIndexedDB();
  return await db.get(IDB_DEFAULT_DETAILS, IDB_DEFAULT_DETAILS_KEY);
};

export const saveDefaultDetails = async (details: ZodDefaultDetailsSchema): Promise<void> => {
  const db = await initIndexedDB();

  await db.put(IDB_DEFAULT_DETAILS, {
    id: IDB_DEFAULT_DETAILS_KEY,
    companyDetails: details.companyDetails,
    clientDetails: details.clientDetails,
    updatedAt: new Date(),
  });
};
