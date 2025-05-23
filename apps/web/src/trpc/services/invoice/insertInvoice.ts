import { getFileSizeFromBase64 } from "@/lib/invoice/get-file-size-from-base64";
import { insertInvoiceQuery } from "@/lib/db-queries/invoice/insertInvoice";
import { authorizedProcedure } from "@/trpc/procedures/authorizedProcedure";
import { createInvoiceSchema } from "@/zod-schemas/invoice/create-invoice";
import { parseCatchError } from "@/lib/neverthrow/parseCatchError";
import { uploadImage } from "@/lib/cloudflare/r2/uploadImage";
import { S3Client } from "@aws-sdk/client-s3";
import { env } from "@invoicely/utilities";
import { TRPCError } from "@trpc/server";

const S3 = new S3Client({
  region: "auto",
  endpoint: env.CF_R2_ENDPOINT,
  credentials: {
    accessKeyId: env.CF_R2_ACCESS_KEY_ID,
    secretAccessKey: env.CF_R2_SECRET_ACCESS_KEY,
  },
});

interface MutationResponse {
  success: boolean;
  message: string;
  invoiceId?: string;
}

export const insertInvoice = authorizedProcedure
  .input(createInvoiceSchema)
  .mutation<MutationResponse>(async ({ ctx, input }) => {
    // If user didn't allow saving data in db then return error
    if (!ctx.auth.user.allowedSavingData) {
      return {
        success: false,
        message: "User has not enabled data saving in their preferences",
      };
    }

    // If file sizes are greater than 250kb then return error
    if (getFileSizeFromBase64(input.companyDetails.signatureBase64) > 250000) {
      return {
        success: false,
        message: "Signature is too large",
      };
    }

    if (getFileSizeFromBase64(input.companyDetails.logoBase64) > 250000) {
      return {
        success: false,
        message: "Logo is too large",
      };
    }

    try {
      // Upload images to cloudflare r2 and get the urls using the S3 client
      if (input.companyDetails.signatureBase64) {
        input.companyDetails.signature = await uploadImage(S3, input.companyDetails.signatureBase64, "signatures");
      }

      if (input.companyDetails.logoBase64) {
        input.companyDetails.logo = await uploadImage(S3, input.companyDetails.logoBase64, "logos");
      }

      const invoiceId = await insertInvoiceQuery(input, ctx.auth.user.id);

      return {
        success: true,
        message: "Invoice saved successfully",
        invoiceId,
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to insert invoice",
        cause: parseCatchError(error),
      });
    }
  });
