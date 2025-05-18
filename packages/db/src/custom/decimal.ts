import { customType } from "drizzle-orm/pg-core";
import { Decimal } from "decimal.js";

interface DecimalCustomType {
  data: Decimal;
  driverData: string;
  config: DecimalConfig;
}

interface DecimalConfig {
  precision: number;
  scale: number;
}

export const Numeric = customType<DecimalCustomType>({
  dataType(config) {
    return config ? `numeric(${config.precision}, ${config.scale})` : "numeric";
  },

  fromDriver(value) {
    return new Decimal(value);
  },

  toDriver(value) {
    return value.toFixed();
  },
});
