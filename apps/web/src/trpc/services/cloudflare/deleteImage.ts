import { authorizedProcedure } from "@/trpc/procedures/authorizedProcedure";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "@/constants/issues";
import { awsS3Middleware } from "@/trpc/middlewares/awsS3Middleware";
import { parseCatchError } from "@/lib/neverthrow/parseCatchError";
import { deleteImage } from "@/lib/cloudflare/r2/deleteImage";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const deleteImageFile = authorizedProcedure
  .use(awsS3Middleware)
  .input(
    z.object({
      key: z.string(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const userId = ctx.auth.user.id;

    try {
      // Check if the image is owned by the user
      if (!input.key.startsWith(userId)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: ERROR_MESSAGES.NOT_ALLOWED_TO_DELETE_IMAGE,
        });
      }

      //    delete image from r2
      const success = await deleteImage(ctx.s3, input.key);

      if (!success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: ERROR_MESSAGES.IMAGE_DELETED,
        });
      }
      return {
        success: true,
        message: SUCCESS_MESSAGES.IMAGE_DELETED,
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: parseCatchError(error),
      });
    }
  });
