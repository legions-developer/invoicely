import { cloudflareContextMiddleware } from "@/trpc/middlewares/cloudflareContextMiddleware";
import { authorizedProcedure } from "@/trpc/procedures/authorizedProcedure";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "@/constants/issues";
import { parseCatchError } from "@/lib/neverthrow/parseCatchError";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const deleteImageFile = authorizedProcedure
  .use(cloudflareContextMiddleware)
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
      await ctx.cloudflareEnv.R2_IMAGES.delete(input.key);

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
