import type { Metadata } from "next";
import { Caveat, Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { EchoEarthProvider } from "@/components/EchoEarthShell";
import AppShell from "@/components/AppShell";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://echoearth.vercel.app"),
  title: {
    default: "EchoEarth — Places speak. We listen.",
    template: "%s | EchoEarth",
  },
  description:
    "EchoEarth gives rivers, lakes, and forests a voice — powered by real environmental data. Explore 15 locations across 3 eras, hear AI narrations grounded in live metrics, and write letters to the places you love.",
  keywords: ["environment", "rivers", "climate", "water quality", "ecology", "AI narration", "Earth Forward"],
  openGraph: {
    title: "EchoEarth — Places speak. We listen.",
    description:
      "Real environmental data told through the first-person voice of rivers, lakes, and lagoons. Explore Ganga, Amazon, Nile, Thames and 11 more across 1976, Today, and 2050.",
    images: [
      {
        url: "/api/og?location=ganga&era=Today",
        width: 1200,
        height: 630,
        alt: "EchoEarth — Ganga River health index",
      },
    ],
    type: "website",
    siteName: "EchoEarth",
  },
  twitter: {
    card: "summary_large_image",
    title: "EchoEarth — Places speak. We listen.",
    description:
      "Real environmental data told through the voice of rivers, lakes, and lagoons.",
    images: ["/api/og?location=ganga&era=Today"],
    creator: "@echoearth",
  },
  robots: {
    index: true,
    follow: true,
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
        className={`${fraunces.variable} ${inter.variable} ${caveat.variable} antialiased`}
      >
        <EchoEarthProvider>
          <AppShell>{children}</AppShell>
        </EchoEarthProvider>
      </body>
    </html>
  );
}