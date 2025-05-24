import { IDB_NAME, IDB_VERSION, IDB_SCHEMA_INVOICES, IDB_IMAGES } from "@/constants/indexed-db";
import { IndexedDBSchema } from "@/types/indexdb";
import { openDB } from "idb";

// Initialize the indexedDB
// This is used to create the object stores when user first opens the app
export const initIndexedDB = async () => {
  return await openDB<IndexedDBSchema>(IDB_NAME, IDB_VERSION, {
    upgrade(db) {
      // Create invoices object store
      if (!db.objectStoreNames.contains(IDB_SCHEMA_INVOICES)) {
        const invoicesStore = db.createObjectStore(IDB_SCHEMA_INVOICES, { keyPath: "id" });
        // Create index for invoices so dont allow duplicates
        invoicesStore.createIndex("id", "id", { unique: true });
      }

      // Create images object store
      if (!db.objectStoreNames.contains(IDB_IMAGES)) {
        const imagesStore = db.createObjectStore(IDB_IMAGES, { keyPath: "id" });
        // Create index for images so dont allow duplicates
        imagesStore.createIndex("id", "id", { unique: true });
      }
    },
  });
};
