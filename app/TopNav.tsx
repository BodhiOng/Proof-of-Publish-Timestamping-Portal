"use client";

import Link from "next/link";
import { useState } from "react";

export default function TopNav() {
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const closeMoreMenu = () => {
    setIsMoreOpen(false);
  };

  return (
    <nav className="flex flex-wrap items-center gap-4 text-xs font-semibold text-gray-300 sm:gap-6">
      <Link href="/publish" className="hover:text-white hover:underline">Publish</Link>
      <Link href="/verify" className="hover:text-white hover:underline">Verify</Link>
      <Link href="/dashboard" className="hover:text-white hover:underline">Dashboard</Link>

      <div className="relative">
        <button
          type="button"
          onClick={() => setIsMoreOpen((current) => !current)}
          className="rounded-full border border-gray-700 px-3 py-1 text-gray-300 hover:border-white hover:text-white"
        >
          More
        </button>

        {isMoreOpen && (
          <div className="absolute right-0 top-8 z-50 min-w-44 rounded-lg border border-white bg-black p-2 shadow-2xl">
            <Link
              href="/dev-tools"
              onClick={closeMoreMenu}
              className="block rounded px-3 py-2 text-gray-300 hover:bg-white hover:text-black"
            >
              Dev Tools
            </Link>
            <Link
              href="/docs/canonicalization"
              onClick={closeMoreMenu}
              className="block rounded px-3 py-2 text-gray-300 hover:bg-white hover:text-black"
            >
              Docs
            </Link>
            <a
              href="https://github.com/BodhiOng/Proof-of-Publish-Timestamping-Portal"
              target="_blank"
              rel="noopener noreferrer"
              onClick={closeMoreMenu}
              className="block rounded px-3 py-2 text-gray-300 hover:bg-white hover:text-black"
            >
              GitHub
            </a>
          </div>
        )}
      </div>

      <Link href="/connect-wallet" className="rounded-full border border-white px-3 py-1 text-white hover:bg-white hover:text-black">
        Wallet &amp; Account
      </Link>
    </nav>
  );
}
