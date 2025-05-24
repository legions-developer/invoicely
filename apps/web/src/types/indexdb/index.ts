import { IDBImage, IDBInvoice } from "@/types/indexdb/invoice";
import { DBSchema } from "idb";
export interface IndexedDBSchema extends DBSchema {
  invoices: {
    key: string;
    value: IDBInvoice;
    indexes: {
      id: string;
    };
  };
  images: {
    key: string;
    value: IDBImage;
    indexes: {
      id: string;
    };
  };
}
