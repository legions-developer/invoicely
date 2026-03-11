import { ForbiddenError, InternalServerError } from "@/lib/effect/error/trpc";
import { insertInvoiceQuery } from "@/lib/db-queries/invoice/insertInvoice";
import { authorizedProcedure } from "@/trpc/procedures/authorizedProcedure";
import { createInvoiceSchema } from "@/zod-schemas/invoice/create-invoice";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "@/constants/issues";
import { parseCatchError } from "@/lib/neverthrow/parseCatchError";
import { invoiceStatusEnum } from "@invoicely/db/schema/invoice";
import { TRPCError } from "@trpc/server";
import { Effect } from "effect";
import { z } from "zod";

const migrateToDbSchema = z.object({
  invoiceFields: createInvoiceSchema,
  status: z.enum(invoiceStatusEnum.enumValues),
  paidAt: z.coerce.date().nullable(),
});

interface MutationResponse {
  success: boolean;
  message: string;
  invoiceId?: string;
}

export const migrateToDb = authorizedProcedure
  .input(migrateToDbSchema)
  .mutation<MutationResponse>(async ({ ctx, input }) => {
    const migrateEffect = Effect.gen(function* () {
      if (!ctx.auth.user.allowedSavingData) {
        return yield* new ForbiddenError({ message: ERROR_MESSAGES.NOT_ALLOWED_TO_SAVE_DATA });
      }

      const invoiceId = yield* Effect.tryPromise({
        try: () =>
          insertInvoiceQuery(input.invoiceFields, ctx.auth.user.id, undefined, {
            status: input.status,
            paidAt: input.paidAt,
          }),
        catch: (error) => new InternalServerError({ message: parseCatchError(error) }),
      });

      return {
        success: true,
        message: SUCCESS_MESSAGES.INVOICE_MIGRATED,
        invoiceId,
      };
    });

    return Effect.runPromise(
      migrateEffect.pipe(
        Effect.catchTags({
          ForbiddenError: (error) => Effect.fail(new TRPCError({ code: "FORBIDDEN", message: error.message })),
          InternalServerError: (error) =>
            Effect.fail(new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message })),
        }),
      ),
    );
  });
