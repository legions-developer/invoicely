import { cloudflareContextMiddleware } from "@/trpc/middlewares/cloudflareContextMiddleware";
import { getFileSizeFromBase64 } from "@/lib/invoice/get-file-size-from-base64";
import { getUserImagesCount } from "@/lib/cloudflare/r2/getUserImagesCount";
import { authorizedProcedure } from "@/trpc/procedures/authorizedProcedure";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "@/constants/issues";
import { parseCatchError } from "@/lib/neverthrow/parseCatchError";
import { uploadImage } from "@/lib/cloudflare/r2/uploadImage";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

const fileSizes = {
  logo: 400000, // 400kb
  signature: 150000, // 150kb
};

export const uploadImageFile = authorizedProcedure
  .use(cloudflareContextMiddleware)
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
        message: ERROR_MESSAGES.NOT_ALLOWED_TO_SAVE_DATA,
      });
    }

    try {
      const userImagesCount = await getUserImagesCount(ctx.cloudflareEnv, userId);

      if (userImagesCount >= 25) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: ERROR_MESSAGES.MAX_IMAGES_REACHED,
        });
      }

      const size = getFileSizeFromBase64(input.base64);

      if (size > fileSizes[input.type]) {
        throw new TRPCError({
          code: "PAYLOAD_TOO_LARGE",
          message: `Image is too large. ${input.type} can only be below ${Math.round(fileSizes[input.type] / 1000)} KB`,
        });
      }

      const image = await uploadImage(ctx.cloudflareEnv, input.base64, userId, input.type);

      if (!image) {
        throw new TRPCError({
          code: "SERVICE_UNAVAILABLE",
          message: ERROR_MESSAGES.UPLOADING_IMAGE,
        });
      }

      return {
        success: true,
        message: SUCCESS_MESSAGES.IMAGE_UPLOADED,
        image: image,
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: parseCatchError(error),
      });
    }
  });
