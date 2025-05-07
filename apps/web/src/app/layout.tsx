import { Geist, Geist_Mono, JetBrains_Mono, Instrument_Serif, Instrument_Sans, Urbanist } from "next/font/google";
import { ReactScanProvider, JotaiProvider, PostHogProvider } from "@/providers";
import { ThemeProvider } from "next-themes";
import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "Invoicely | Invoice Generator",
  description: "Invoicely is a simple and easy to use invoice generator ~ Proudly OSS",
  icons: {
    icon: "/official/invoicely-logo.png",
  },
};

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
        <PostHogProvider>
          <JotaiProvider>
            <ThemeProvider attribute="class" defaultTheme="system" storageKey="invoicely-theme">
              <ReactScanProvider />
              <Toaster />
              {children}
            </ThemeProvider>
          </JotaiProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
