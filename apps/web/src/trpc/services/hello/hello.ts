import { baseProcedure } from "@/trpc/init";
import Decimal from "decimal.js";
import { z } from "zod";

export const hellotest = baseProcedure
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
