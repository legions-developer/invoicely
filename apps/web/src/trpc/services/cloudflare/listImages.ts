import { cloudflareContextMiddleware } from "@/trpc/middlewares/cloudflareContextMiddleware";
import { authorizedProcedure } from "@/trpc/procedures/authorizedProcedure";
import { parseCatchError } from "@/lib/neverthrow/parseCatchError";
import { SUCCESS_MESSAGES } from "@/constants/issues";
import { TRPCError } from "@trpc/server";

export const listImages = authorizedProcedure.use(cloudflareContextMiddleware).query(async ({ ctx }) => {
  const userId = ctx.auth.user.id;

  try {
    const images = await ctx.cloudflareEnv.R2_IMAGES.list({
      prefix: `${userId}/`,
    });

    const mappedImageKeys = images.objects.map((image) => image.key);

    return {
      success: true,
      message: SUCCESS_MESSAGES.IMAGES_FETCHED,
      images: mappedImageKeys,
      count: images.objects.length,
    };
  } catch (error) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: parseCatchError(error),
    });
  }
});
