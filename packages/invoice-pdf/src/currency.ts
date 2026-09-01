import getSymbolFromCurrency from "currency-symbol-map";

const currencyLocaleMap: Record<string, string> = {
  USD: "en-US",
  EUR: "de-DE",
  GBP: "en-GB",
  INR: "en-IN",
  JPY: "ja-JP",
  CNY: "zh-CN",
  AUD: "en-AU",
  CAD: "en-CA",
  CHF: "de-CH",
  SEK: "sv-SE",
  NZD: "en-NZ",
};

export function formatCurrencyText(currency: string, amount: number): string {
  try {
    const locale = currencyLocaleMap[currency] ?? "en-US";

    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${getSymbolFromCurrency(currency)}${amount.toFixed(2)}`;
  }
}
