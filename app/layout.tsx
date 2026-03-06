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
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 lg:px-12">
            <Link href="/" className="text-sm font-bold text-white hover:underline">
              Proof of Publish
            </Link>
            <TopNav />
          </div>
        </header>
        <ScrollToTopOnRouteChange />
        {children}
      </body>
    </html>
  );
}
