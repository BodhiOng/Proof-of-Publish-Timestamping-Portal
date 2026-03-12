import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import ScrollToTopOnRouteChange from "./ScrollToTopOnRouteChange";
import TopNav from "./TopNav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Blockchain Assignment Part 2",
  description: "Created with Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <header className="sticky top-0 z-50 border-b border-white bg-black/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4 lg:px-12">
            <Link href="/" className="text-center text-base font-bold text-white hover:underline sm:text-left sm:text-sm">
              Proof of Publish
            </Link>
            <div className="w-full border-t border-gray-800 pt-2 sm:w-auto sm:border-t-0 sm:pt-0">
              <TopNav />
            </div>
          </div>
        </header>
        <ScrollToTopOnRouteChange />
        {children}
      </body>
    </html>
  );
}
