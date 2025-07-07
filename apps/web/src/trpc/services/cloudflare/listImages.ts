import { authorizedProcedure } from "@/trpc/procedures/authorizedProcedure";
import { awsS3Middleware } from "@/trpc/middlewares/awsS3Middleware";
import { parseCatchError } from "@/lib/neverthrow/parseCatchError";
import { getUserImages } from "@/lib/cloudflare/r2/getUserImages";
import { R2StorageError } from "@/lib/effect/error/trpc";
import { SUCCESS_MESSAGES } from "@/constants/issues";
import { TRPCError } from "@trpc/server";
import { Effect } from "effect";

export const listImages = authorizedProcedure.use(awsS3Middleware).query(({ ctx }) => {
  const userId = ctx.auth.user.id;

  // List Images Effect
  const listImages = Effect.gen(function* () {
    // Fetch images from Cloudflare R2 with user-specific prefix
    const images = yield* Effect.tryPromise({
      try: () => getUserImages(ctx.s3, userId),
      catch: (error) => new R2StorageError({ message: parseCatchError(error) }),
    });

    // Map the image objects to their keys
    const mappedImageKeys = images.map((image) => image.Key).filter((key) => key !== undefined);

    // Return the success response with image data
    return {
      success: true,
      message: SUCCESS_MESSAGES.IMAGES_FETCHED,
      images: mappedImageKeys,
      count: images.length,
    };
  });

  // Run the effect
  return Effect.runPromise(
    listImages.pipe(
      Effect.catchTags({
        // If fetching images fails, return an internal server error
        R2StorageError: (error) =>
          Effect.fail(new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message })),
      }),
    ),
  );
});
