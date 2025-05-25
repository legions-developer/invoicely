import { authorizedProcedure } from "@/trpc/procedures/authorizedProcedure";
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
          message: "You are not allowed to delete this image",
        });
      }

      //    delete image from r2
      const success = await deleteImage(ctx.s3, input.key);

      if (!success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete image",
        });
      }
      return {
        success: true,
        message: "Image deleted successfully",
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: parseCatchError(error),
      });
    }
  });
