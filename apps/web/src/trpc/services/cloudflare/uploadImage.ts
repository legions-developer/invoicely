import { getFileSizeFromBase64 } from "@/lib/invoice/get-file-size-from-base64";
import { getUserImagesCount } from "@/lib/cloudflare/r2/getUserImagesCount";
import { authorizedProcedure } from "@/trpc/procedures/authorizedProcedure";
import { awsS3Middleware } from "@/trpc/middlewares/awsS3Middleware";
import { parseCatchError } from "@/lib/neverthrow/parseCatchError";
import { uploadImage } from "@/lib/cloudflare/r2/uploadImage";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

const fileSizes = {
  logo: 400000, // 400kb
  signature: 150000, // 150kb
};

export const uploadImageFile = authorizedProcedure
  .use(awsS3Middleware)
  .input(
    z.object({
      type: z.enum(["logo", "signature"]),
      base64: z.string(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const userId = ctx.auth.user.id;

    if (!ctx.auth.user.allowedSavingData) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You are not allowed to save data",
      });
    }

    try {
      const userImagesCount = await getUserImagesCount(ctx.s3, userId);

      if (userImagesCount >= 25) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You have reached the maximum number of images in your account! Try deleting some images.",
        });
      }

      const size = getFileSizeFromBase64(input.base64);

      if (size > fileSizes[input.type]) {
        throw new TRPCError({
          code: "PAYLOAD_TOO_LARGE",
          message: `Image is too large. ${input.type} can only be below ${Math.round(fileSizes[input.type] / 1000)} KB`,
        });
      }

      const image = await uploadImage(ctx.s3, input.base64, userId, input.type);

      if (!image) {
        throw new TRPCError({
          code: "SERVICE_UNAVAILABLE",
          message: "Failed to upload image",
        });
      }

      return {
        success: true,
        message: "Image uploaded successfully",
        image: image,
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: parseCatchError(error),
      });
    }
  });
