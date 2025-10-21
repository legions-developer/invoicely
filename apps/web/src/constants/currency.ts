// @ts-expect-error - currency-symbol-map/map is not typed but it does return a map of all symbol and currency code
import currencyToSymbolMap from "currency-symbol-map/map";
import getSymbolFromCurrency from "currency-symbol-map";
export const currenciesWithSymbols: Record<string, string> = currencyToSymbolMap;

// Map currency codes to their common locales
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

export const formatCurrencyText = (currency: string, amount: number) => {
  try {
    const locale = currencyLocaleMap[currency] || "en-US";

    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    // Fallback to simple formatting with symbol
    return `${getSymbolFromCurrency(currency)}${amount.toFixed(2)}`;
  }
};
