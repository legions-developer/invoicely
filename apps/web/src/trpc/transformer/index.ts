import { stringify, parse } from "devalue";
import Decimal from "decimal.js";

export const superjsonTransformer = {
  serialize: (serializeValue: unknown) =>
    stringify(serializeValue, {
      Decimal: (value) => (Decimal.isDecimal(value) ? value.toJSON() : false),
    }),
  deserialize: (deserializeValue: unknown) => {
    if (typeof deserializeValue !== "string") return deserializeValue;

    return parse(deserializeValue, {
      Decimal: (value: string) => new Decimal(value),
    });
  },
};
