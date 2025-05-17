import {
  ReactScanProvider,
  JotaiProvider,
  PostHogProvider,
  OneDollarStatsProvider,
  OpenPanelProvider,
} from "@/providers";
import { Geist, Geist_Mono, JetBrains_Mono, Instrument_Serif, Instrument_Sans, Urbanist } from "next/font/google";
import { defaultWebsiteMetadata, defaultWebsiteViewport } from "@/constants";
import { TOAST_ICONS, TOAST_OPTIONS } from "@/constants/toast";
import { ThemeProvider } from "next-themes";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";
import "./globals.css";
import "./fonts.css";

// Geist Sans
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Geist Mono
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// JetBrains Mono
const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

// Instrument Serif
const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: ["400"],
});

// Instrument Sans
const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Urbanist
const urbanist = Urbanist({
  variable: "--font-urbanist",
  subsets: ["latin"],
});

export const metadata = defaultWebsiteMetadata;
export const viewport = defaultWebsiteViewport;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          geistSans.variable,
          geistMono.variable,
          jetBrainsMono.variable,
          instrumentSerif.variable,
          instrumentSans.variable,
          urbanist.variable,
          "antialiased",
        )}
      >
        <OpenPanelProvider>
          <OneDollarStatsProvider>
            <PostHogProvider>
              <JotaiProvider>
                <ThemeProvider attribute="class" defaultTheme="system" storageKey="invoicely-theme">
                  <ReactScanProvider />
                  <Toaster
                    richColors
                    position="top-right"
                    toastOptions={TOAST_OPTIONS}
                    icons={TOAST_ICONS}
                    visibleToasts={4}
                  />
                  {children}
                </ThemeProvider>
              </JotaiProvider>
            </PostHogProvider>
          </OneDollarStatsProvider>
        </OpenPanelProvider>
      </body>
    </html>
  );
}
