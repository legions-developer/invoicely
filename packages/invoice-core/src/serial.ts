export const DEFAULT_INVOICE_SERIAL_NUMBER = "0001";

export function incrementSerialNumber(serialNumber: string, fallback = DEFAULT_INVOICE_SERIAL_NUMBER): string {
  const match = serialNumber.match(/^(.*?)(\d+)(\D*)$/);

  if (!match) {
    return fallback;
  }

  const [, leading = "", digits = "", trailing = ""] = match;
  const next = incrementDigitString(digits).padStart(digits.length, "0");

  return `${leading}${next}${trailing}`;
}

function incrementDigitString(value: string): string {
  const digits = value.split("");
  let carry = 1;

  for (let index = digits.length - 1; index >= 0 && carry === 1; index -= 1) {
    const nextDigit = Number(digits[index]) + carry;
    digits[index] = String(nextDigit % 10);
    carry = nextDigit >= 10 ? 1 : 0;
  }

  return `${carry === 1 ? "1" : ""}${digits.join("")}`;
}
