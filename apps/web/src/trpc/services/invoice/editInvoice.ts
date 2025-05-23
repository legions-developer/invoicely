import { getFileSizeFromBase64 } from "@/lib/invoice/get-file-size-from-base64";
import { deleteInvoiceQuery } from "@/lib/db-queries/invoice/deleteInvoice";
import { insertInvoiceQuery } from "@/lib/db-queries/invoice/insertInvoice";
import { authorizedProcedure } from "@/trpc/procedures/authorizedProcedure";
import { createInvoiceSchema } from "@/zod-schemas/invoice/create-invoice";
import { getInvoiceQuery } from "@/lib/db-queries/invoice/getInvoice";
import { parseCatchError } from "@/lib/neverthrow/parseCatchError";
import { uploadImage } from "@/lib/cloudflare/r2/uploadImage";
import { S3Client } from "@aws-sdk/client-s3";
import { env } from "@invoicely/utilities";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

const S3 = new S3Client({
  region: "auto",
  endpoint: env.CF_R2_ENDPOINT,
  credentials: {
    accessKeyId: env.CF_R2_ACCESS_KEY_ID,
    secretAccessKey: env.CF_R2_SECRET_ACCESS_KEY,
  },
});

const EditInvoiceSchema = z.object({
  id: z.string(),
  invoice: createInvoiceSchema,
});

export const editInvoice = authorizedProcedure.input(EditInvoiceSchema).mutation(async ({ input, ctx }) => {
  const { id, invoice } = input;

  //   if signature or logo is too large then return error ~ 250kb
  if (getFileSizeFromBase64(invoice.companyDetails.signatureBase64) > 250000) {
    return {
      success: false,
      message: "Signature is too large",
    };
  }

  if (getFileSizeFromBase64(invoice.companyDetails.logoBase64) > 250000) {
    return {
      success: false,
      message: "Logo is too large",
    };
  }

  try {
    const oldInvoice = await getInvoiceQuery(id, ctx.auth.user.id);

    if (!oldInvoice) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Invoice not found" });
    }

    //   now as we found old invoice , we will delete it from the database ( yea im pro :3)
    await deleteInvoiceQuery(id, ctx.auth.user.id);

    // Upload images to cloudflare r2 and get the urls using the S3 client
    // if signature is already uploaded then don't upload it again
    if (invoice.companyDetails.signatureBase64 && !invoice.companyDetails.signature?.includes("https://")) {
      invoice.companyDetails.signature = await uploadImage(
        S3,
        invoice.companyDetails.signatureBase64,
        ctx.auth.user.id,
        "signature",
      );
    }

    // if logo is already uploaded then don't upload it again
    if (invoice.companyDetails.logoBase64 && !invoice.companyDetails.logo?.includes("https://")) {
      invoice.companyDetails.logo = await uploadImage(S3, invoice.companyDetails.logoBase64, ctx.auth.user.id, "logo");
    }

    //   now we will insert the new invoice with same id
    await insertInvoiceQuery(invoice, ctx.auth.user.id, oldInvoice.id);

    return {
      success: true,
      message: "Invoice edited successfully",
    };
  } catch (error) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to edit invoice",
      cause: parseCatchError(error),
    });
  }
});
