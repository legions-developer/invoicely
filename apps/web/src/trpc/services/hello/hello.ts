import { authorizedProcedure } from "@/trpc/procedures/authorizedProcedure";
import Decimal from "decimal.js";
import { z } from "zod";

export const hellotest = authorizedProcedure
  .input(
    z.object({
      text: z.string(),
    }),
  )
  .query(({ input }) => {
    return {
      greeting: `hello ${input.text} sir, from hello.ts`,
      decimal: new Decimal(100),
      date: new Date(),
    };
  });
