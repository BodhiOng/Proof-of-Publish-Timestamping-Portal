"use client";

import Link from "next/link";
import { useState } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";

export default function TopNav() {
  const isMobile = useIsMobile();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const closeMoreMenu = () => {
    setIsMoreOpen(false);
  };

  return (
    <nav className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-semibold text-gray-300 sm:justify-end sm:gap-6 sm:text-xs">
      <Link href="/publish" className="hover:text-white hover:underline">Publish</Link>
      <Link href="/verify" className="hover:text-white hover:underline">Verify</Link>
      {!isMobile && <Link href="/dashboard" className="hover:text-white hover:underline">Dashboard</Link>}

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
            {isMobile && (
              <Link
                href="/dashboard"
                onClick={closeMoreMenu}
                className="block rounded px-3 py-2 text-gray-300 hover:bg-white hover:text-black"
              >
                Dashboard
              </Link>
            )}
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

      <Link href="/connect-wallet" className="rounded-full border border-white px-2.5 py-1 text-white hover:bg-white hover:text-black sm:px-3">
        {isMobile ? "Wallet" : "Wallet & Account"}
      </Link>
    </nav>
  );
}
