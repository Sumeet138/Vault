import type { Metadata } from "next";
import "@/assets/fonts/fonts.css";
import "./globals.css";
import RootProvider from "@/providers/RootProvider";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Shingru - Get Paid, Stay Private",
  description:
    "Create shareable payment links that generate fresh, untraceable addresses for every payment. Maintain full self-custody while protecting your financial privacy.",
  openGraph: {
    title: "Shingru - Get Paid, Stay Private",
    url: "https://shingru.me",
    description:
      "Create shareable payment links that generate fresh, untraceable addresses for every payment. Maintain full self-custody while protecting your financial privacy.",
  },
  twitter: {
    title: "Shingru - Get Paid, Stay Private",
    description:
      "Create shareable payment links that generate fresh, untraceable addresses for every payment. Maintain full self-custody while protecting your financial privacy.",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any", type: "image/x-icon" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      {
        url: "/android-chrome-192x192.png",
        type: "image/png",
        sizes: "192x192",
      },
      {
        url: "/android-chrome-512x512.png",
        type: "image/png",
        sizes: "512x512",
      },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
        <link rel="icon" href="/favicon.ico" sizes="any" type="image/x-icon" />
        <link
          rel="icon"
          href="/favicon-16x16.png"
          type="image/png"
          sizes="16x16"
        />
        <link
          rel="icon"
          href="/favicon-32x32.png"
          type="image/png"
          sizes="32x32"
        />
        <link
          rel="icon"
          href="/android-chrome-192x192.png"
          type="image/png"
          sizes="192x192"
        />
        <link
          rel="icon"
          href="/android-chrome-512x512.png"
          type="image/png"
          sizes="512x512"
        />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className={`antialiased ${inter.variable}`}>
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
