import { authorizedProcedure } from "@/trpc/procedures/authorizedProcedure";
import { awsS3Middleware } from "@/trpc/middlewares/awsS3Middleware";
import { parseCatchError } from "@/lib/neverthrow/parseCatchError";
import { getUserImages } from "@/lib/cloudflare/r2/getUserImages";
import { TRPCError } from "@trpc/server";

export const listImages = authorizedProcedure.use(awsS3Middleware).query(async ({ ctx }) => {
  const userId = ctx.auth.user.id;

  try {
    const images = await getUserImages(ctx.s3, userId);

    return {
      images: images,
      count: images.length,
    };
  } catch (error) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: parseCatchError(error) || "Failed to fetch images",
      cause: parseCatchError(error),
    });
  }
});
