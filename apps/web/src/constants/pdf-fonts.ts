import type { FontSource$1 as PdfFont } from "@react-pdf/font";

export const INTER_FONT: PdfFont[] = [
  {
    src: "/fonts/inter/Inter-Regular.ttf",
    fontWeight: "normal",
  },
  {
    src: "/fonts/inter/Inter-ExtraLight.ttf",
    fontWeight: "ultralight",
  },
  {
    src: "/fonts/inter/Inter-Thin.ttf",
    fontWeight: "thin",
  },
  {
    src: "/fonts/inter/Inter-Light.ttf",
    fontWeight: "light",
  },
  {
    src: "/fonts/inter/Inter-Medium.ttf",
    fontWeight: "medium",
  },
  {
    src: "/fonts/inter/Inter-SemiBold.ttf",
    fontWeight: "semibold",
  },
  {
    src: "/fonts/inter/Inter-Bold.ttf",
    fontWeight: "bold",
  },
  {
    src: "/fonts/inter/Inter-ExtraBold.ttf",
    fontWeight: "bold",
  },
  // Inter Italics
  {
    src: "/fonts/inter/Inter-Italic.ttf",
    fontWeight: "normal",
    fontStyle: "italic",
  },
  {
    src: "/fonts/inter/Inter-LightItalic.ttf",
    fontWeight: "light",
    fontStyle: "italic",
  },
  {
    src: "/fonts/inter/Inter-MediumItalic.ttf",
    fontWeight: "medium",
    fontStyle: "italic",
  },
  {
    src: "/fonts/inter/Inter-SemiBoldItalic.ttf",
    fontWeight: "semibold",
    fontStyle: "italic",
  },
  {
    src: "/fonts/inter/Inter-BoldItalic.ttf",
    fontWeight: "bold",
    fontStyle: "italic",
  },
  {
    src: "/fonts/inter/Inter-ExtraBoldItalic.ttf",
    fontWeight: "bold",
    fontStyle: "italic",
  },
];

export const GEIST_MONO_FONT: PdfFont[] = [
  {
    src: "/fonts/geistmono/GeistMono-Thin.ttf",
    fontWeight: "thin",
  },
  {
    src: "/fonts/geistmono/GeistMono-ExtraLight.ttf",
    fontWeight: "ultralight",
  },
  {
    src: "/fonts/geistmono/GeistMono-Light.ttf",
    fontWeight: "light",
  },
  {
    src: "/fonts/geistmono/GeistMono-Regular.ttf",
    fontWeight: "normal",
  },
  {
    src: "/fonts/geistmono/GeistMono-Medium.ttf",
    fontWeight: "medium",
  },
  {
    src: "/fonts/geistmono/GeistMono-SemiBold.ttf",
    fontWeight: "semibold",
  },
  {
    src: "/fonts/geistmono/GeistMono-Bold.ttf",
    fontWeight: "bold",
  },
  {
    src: "/fonts/geistmono/GeistMono-ExtraBold.ttf",
    fontWeight: "ultrabold",
  },
  {
    src: "/fonts/geistmono/GeistMono-Black.ttf",
    fontWeight: "heavy",
  },
];

export const GEIST_FONT: PdfFont[] = [
  {
    src: "/fonts/geist/Geist-Thin.ttf",
    fontWeight: "thin",
  },
  {
    src: "/fonts/geist/Geist-ExtraLight.ttf",
    fontWeight: "ultralight",
  },
  {
    src: "/fonts/geist/Geist-Light.ttf",
    fontWeight: "light",
  },
  {
    src: "/fonts/geist/Geist-Regular.ttf",
    fontWeight: "normal",
  },
  {
    src: "/fonts/geist/Geist-Medium.ttf",
    fontWeight: "medium",
  },
  {
    src: "/fonts/geist/Geist-SemiBold.ttf",
    fontWeight: "semibold",
  },
  {
    src: "/fonts/geist/Geist-Bold.ttf",
    fontWeight: "bold",
  },
  {
    src: "/fonts/geist/Geist-ExtraBold.ttf",
    fontWeight: "ultrabold",
  },
  {
    src: "/fonts/geist/Geist-Black.ttf",
    fontWeight: "heavy",
  },
];

export const QUICKSAND_FONT: PdfFont[] = [
  {
    src: "/fonts/quicksand/Quicksand-Regular.ttf",
    fontWeight: "normal",
  },
  {
    src: "/fonts/quicksand/Quicksand-Bold.ttf",
    fontWeight: "bold",
  },
  {
    src: "/fonts/quicksand/Quicksand-Medium.ttf",
    fontWeight: "medium",
  },
  {
    src: "/fonts/quicksand/Quicksand-SemiBold.ttf",
    fontWeight: "semibold",
  },
  {
    src: "/fonts/quicksand/Quicksand-Light.ttf",
    fontWeight: "light",
  },
];

export const JETBRAINS_MONO_FONT: PdfFont[] = [
  {
    src: "/fonts/jetbrains/JetBrainsMono-Regular.ttf",
    fontWeight: "normal",
  },
  {
    src: "/fonts/jetbrains/JetBrainsMono-Light.ttf",
    fontWeight: "light",
  },
];

// Noto Sans SC — covers CJK (Mandarin) glyphs that the Latin fonts above lack.
// Used as an automatic fallback for invoices containing Chinese characters (see issue #48).
export const NOTO_SANS_SC_FONT: PdfFont[] = [
  {
    src: "/fonts/notosanssc/NotoSansSC-Regular.woff2",
    fontWeight: "normal",
  },
];

// Family name of the automatic CJK fallback (not user-selectable).
export const CJK_FALLBACK_FAMILY = "NotoSansSC";

// User-selectable body fonts for an invoice. The key is persisted on the invoice theme.
export type InvoiceFontName = "quicksand" | "geist" | "inter" | "jetbrainsmono";

export const INVOICE_BODY_FONTS: Record<InvoiceFontName, { label: string; family: string; fonts: PdfFont[] }> = {
  quicksand: { label: "Quicksand", family: "Quicksand", fonts: QUICKSAND_FONT },
  geist: { label: "Geist", family: "Geist", fonts: GEIST_FONT },
  inter: { label: "Inter", family: "Inter", fonts: INTER_FONT },
  jetbrainsmono: { label: "JetBrains Mono", family: "JetBrainsMono", fonts: JETBRAINS_MONO_FONT },
};
