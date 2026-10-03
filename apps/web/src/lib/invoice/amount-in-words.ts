import { toWords } from "number-to-words";

// Match the two decimal places used by formatCurrencyText, including its rounding.
const amountFormatter = new Intl.NumberFormat("en-US", {
  useGrouping: false,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const titleCase = (text: string) => text.replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());

export const getAmountInWordsSuffix = (currency: string, amount: number) => {
  let name = currency.trim().toUpperCase();

  try {
    // Intl supplies currency names and irregular plurals without a currency map.
    name =
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: name,
        currencyDisplay: "name",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      })
        .formatToParts(Math.abs(amount))
        .find((part) => part.type === "currency")?.value ?? name;
  } catch {
    // Legacy or custom currency codes still produce a usable label.
  }

  return `${titleCase(name)} Only`.trim();
};

export const formatAmountInWords = (amount: number, currency: string) => {
  if (!Number.isFinite(amount)) return "";

  const parts = amountFormatter.formatToParts(Math.abs(amount));
  const integer = parts.find((part) => part.type === "integer")!.value;
  const fraction = parts.find((part) => part.type === "fraction")!.value;
  const roundedAmount = Number(`${integer}.${fraction}`);
  const whole = Number(integer);
  const wholeWords = Number.isSafeInteger(whole) ? toWords(whole).replace(/[-,]/g, " ") : integer;
  const words = [
    amount < 0 && roundedAmount !== 0 ? "minus" : "",
    wholeWords,
    // Spell decimal digits rather than assuming every currency uses cents.
    fraction !== "00" ? `point ${Array.from(fraction, (digit) => toWords(Number(digit))).join(" ")}` : "",
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ");
  return `${titleCase(words)} ${getAmountInWordsSuffix(currency, roundedAmount)}`;
};
