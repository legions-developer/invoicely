import { ForbiddenError, PayloadTooLargeError, R2StorageError, ServiceUnavailableError } from "@/lib/effect/error/trpc";
import { getFileSizeFromBase64 } from "@/lib/invoice/get-file-size-from-base64";
import { getUserImagesCount } from "@/lib/cloudflare/r2/getUserImagesCount";
import { authorizedProcedure } from "@/trpc/procedures/authorizedProcedure";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "@/constants/issues";
import { awsS3Middleware } from "@/trpc/middlewares/awsS3Middleware";
import { parseCatchError } from "@/lib/neverthrow/parseCatchError";
import { uploadImage } from "@/lib/cloudflare/r2/uploadImage";
import { TRPCError } from "@trpc/server";
import { Effect } from "effect";
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

    // Upload Image Effect
    const uploadImageEffect = Effect.gen(function* () {
      // Check if the user is allowed to save data
      if (!ctx.auth.user.allowedSavingData) {
        return yield* new ForbiddenError({ message: ERROR_MESSAGES.NOT_ALLOWED_TO_SAVE_DATA });
      }

      // Getting the number of images the user has uploaded
      const userImagesCount = yield* Effect.tryPromise({
        try: () => getUserImagesCount(ctx.s3, userId),
        catch: (error) => new R2StorageError({ message: parseCatchError(error) }),
      });

      // Check if the user has reached the maximum number of images
      if (userImagesCount >= 25) {
        return yield* new ForbiddenError({ message: ERROR_MESSAGES.MAX_IMAGES_REACHED });
      }

      // Get the size of the image
      const size = getFileSizeFromBase64(input.base64);

      // Check if the image is too large
      const typeSize = fileSizes[input.type];

      // Check if the image is too large
      if (size > typeSize) {
        return yield* new PayloadTooLargeError({
          message: `Image is too large. ${input.type} can only be below ${Math.round(typeSize / 1000)} KB`,
        });
      }

      // Upload the image to Cloudflare R2
      const image = yield* Effect.tryPromise({
        try: () => uploadImage(ctx.s3, input.base64, userId, input.type),
        catch: (error) => new R2StorageError({ message: parseCatchError(error) }),
      });

      // Check if the image was uploaded successfully
      if (!image) {
        return yield* new ServiceUnavailableError({ message: ERROR_MESSAGES.UPLOADING_IMAGE });
      }

      // Return the success message
      return {
        success: true,
        message: SUCCESS_MESSAGES.IMAGE_UPLOADED,
        image: image,
      };
    });

    // Run the effect
    return Effect.runPromise(
      uploadImageEffect.pipe(
        Effect.catchTags({
          // If the user is not allowed to save data, return a forbidden error
          ForbiddenError: (error) => Effect.fail(new TRPCError({ code: "FORBIDDEN", message: error.message })),
          // If the image is too large, return a payload too large error
          PayloadTooLargeError: (error) =>
            Effect.fail(new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: error.message })),
          // If the image was not uploaded successfully, return a service unavailable error
          ServiceUnavailableError: (error) =>
            Effect.fail(new TRPCError({ code: "SERVICE_UNAVAILABLE", message: error.message })),
          // If the image was not uploaded successfully, return a service unavailable error
          R2StorageError: (error) =>
            Effect.fail(new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message })),
        }),
      ),
    );
  });
