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
  metadataBase: new URL("https://echoearth.app"),
  title: "EchoEarth — Places speak. We listen.",
  description: "A data-grounded environmental storytelling experience for real places.",
  openGraph: {
    title: "EchoEarth — Places speak. We listen.",
    description: "Real environmental data told through the voice of rivers, lakes, and lagoons.",
    images: [{ url: "/api/og?location=ganga&era=Today", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "EchoEarth — Places speak. We listen.",
    description: "Real environmental data told through the voice of rivers, lakes, and lagoons.",
    images: ["/api/og?location=ganga&era=Today"],
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