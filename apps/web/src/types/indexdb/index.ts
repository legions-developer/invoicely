import { IDBImage, IDBInvoice } from "@/types/indexdb/invoice";
import { DBSchema } from "idb";
export interface IndexedDBSchema extends DBSchema {
  inv_invoices: {
    key: string;
    value: IDBInvoice;
    indexes: {
      id: string;
    };
  };
  inv_images: {
    key: string;
    value: IDBImage;
    indexes: {
      id: string;
    };
  };
}
