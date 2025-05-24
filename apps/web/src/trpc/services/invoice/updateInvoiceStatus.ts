import { authorizedProcedure } from "@/trpc/procedures/authorizedProcedure";
import { parseCatchError } from "@/lib/neverthrow/parseCatchError";
import { invoiceStatusEnum } from "@invoicely/db/schema/invoice";
import { db, schema } from "@invoicely/db";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

const updateInvoiceStatusSchema = z.object({
  id: z.string(),
  status: z.enum(invoiceStatusEnum.enumValues),
});

export const updateInvoiceStatus = authorizedProcedure
  .input(updateInvoiceStatusSchema)
  .mutation(async ({ ctx, input }) => {
    try {
      // Finding the invoice in db with id
      const invoice = await db.query.invoices.findFirst({
        where: (_invoice, { eq, and }) => and(eq(_invoice.id, input.id), eq(_invoice.userId, ctx.auth.user.id)),
      });

      if (!invoice) {
        return {
          success: false,
          message: "Invoice not found! Please try again.",
        };
      }

      // Checking if current invoice status is same as the new status
      if (invoice.status === input.status) {
        return {
          success: false,
          message: "Try updating to a different status. Current status is same as the new status.",
        };
      }

      // Updating the invoice status
      await db
        .update(schema.invoices)
        .set({
          status: input.status,
          paidAt: input.status === "success" ? new Date() : null,
        })
        .where(and(eq(schema.invoices.id, input.id), eq(schema.invoices.userId, ctx.auth.user.id)));

      return {
        success: true,
        message: "The status of the invoice has been updated successfully.",
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to update invoice status",
        cause: parseCatchError(error),
      });
    }
  });
