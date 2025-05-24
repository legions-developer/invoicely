import { uploadImageFile } from "./uploadImage";
import { deleteImageFile } from "./deleteImage";
import { createTRPCRouter } from "@/trpc/init";
import { listImages } from "./listImages";

export const cloudflareRouter = createTRPCRouter({
  listImages: listImages,
  uploadImageFile: uploadImageFile,
  deleteImageFile: deleteImageFile,
});
