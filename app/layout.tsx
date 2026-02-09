import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
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
            <nav className="flex flex-wrap items-center gap-4 text-xs font-semibold text-gray-300 sm:gap-6">
              <Link href="/publish" className="hover:text-white hover:underline">Publish</Link>
              <Link href="/verify" className="hover:text-white hover:underline">Verify</Link>
              <Link href="/dashboard" className="hover:text-white hover:underline">Dashboard</Link>
              <Link href="/dev-tools" className="hover:text-white hover:underline">Dev Tools</Link>
              <Link href="/docs/canonicalization" className="hover:text-white hover:underline">Docs</Link>
              <Link href="/faq" className="hover:text-white hover:underline">FAQ</Link>
              <Link href="/connect-wallet" className="rounded-full border border-white px-3 py-1 text-white hover:bg-white hover:text-black">Connect Wallet</Link>
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
