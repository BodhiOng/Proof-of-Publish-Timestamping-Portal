"use client";

import Link from "next/link";
import { useState } from "react";

type PublicationStatus = "PENDING" | "CONFIRMED" | "FAILED";
type Publication = {
  id: string;
  title: string;
  contentHash: string;
  snippet: string;
  status: PublicationStatus;
  txHash?: string;
  blockTimestamp?: string;
  parentHash?: string;
};

const mockPublications: Publication[] = [
  {
    id: "1",
    title: "My First Publication",
    snippet: "This is the content of my first publication...",
    contentHash: "0xabcd1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab",
    status: "CONFIRMED",
    txHash: "0x1111222233334444555566667777888899990000aaaabbbbccccddddeeeeffff",
    blockTimestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "2",
    title: "Updated Version",
    snippet: "This is an updated version of the previous content...",
    contentHash: "0xdef4567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    status: "CONFIRMED",
    txHash: "0x2222333344445555666677778888999900001111aaaabbbbccccddddeeeeffff",
    blockTimestamp: new Date(Date.now() - 3600000).toISOString(),
    parentHash: "0xabcd1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab",
  },
  {
    id: "3",
    title: "Pending Publication",
    snippet: "This publication is still being confirmed...",
    contentHash: "0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba",
    status: "PENDING",
  },
];

export default function DashboardPage() {
  const [publications] = useState<Publication[]>(mockPublications);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<PublicationStatus | "ALL">("ALL");
  const [walletAddress] = useState("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1");
  const [walletConnected] = useState(true);

  const filteredPublications = publications.filter((pub) => {
    const matchesSearch = 
      pub.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pub.contentHash.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || pub.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const downloadProof = (pub: Publication) => {
    const proof = {
      publicationId: pub.id,
      title: pub.title,
      contentHash: pub.contentHash,
      status: pub.status,
      txHash: pub.txHash,
      blockTimestamp: pub.blockTimestamp,
      parentHash: pub.parentHash,
    };
    
    const blob = new Blob([JSON.stringify(proof, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `proof-${pub.id}.json`;
    a.click();
  };

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-12">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between border-b border-white pb-6">
          <div>
            <Link href="/" className="text-sm text-gray-400 hover:text-white">
              ← Back to Home
            </Link>
            <h1 className="mt-2 text-3xl font-bold">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-400">
              Manage your publications and view version chains
            </p>
          </div>
          <Link
            href="/publish"
            className="rounded-full bg-white px-6 py-2 text-sm font-bold text-black hover:bg-gray-200"
          >
            + New Publication
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Wallet Info */}
            <div className="rounded-lg border border-white bg-black p-6">
              <h2 className="mb-4 text-lg font-bold">Wallet Status</h2>
              {walletConnected ? (
                <div className="space-y-3">
                  <div>
                    <p className="mb-1 text-xs text-gray-400">Connected Account</p>
                    <code className="block truncate text-xs text-white">{walletAddress}</code>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-white"></div>
                    <span className="text-xs font-bold">Connected</span>
                  </div>
                  <button className="w-full rounded border border-white bg-black px-4 py-2 text-xs font-bold text-white hover:bg-white hover:text-black">
                    Disconnect
                  </button>
                </div>
              ) : (
                <Link
                  href="/connect-wallet"
                  className="block w-full rounded bg-white px-4 py-2 text-center text-xs font-bold text-black hover:bg-gray-200"
                >
                  Connect Wallet
                </Link>
              )}
            </div>

            {/* Stats */}
            <div className="rounded-lg border border-gray-700 bg-black p-6">
              <h2 className="mb-4 text-lg font-bold">Statistics</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Total Publications</span>
                  <span className="font-bold text-white">{publications.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Confirmed</span>
                  <span className="font-bold text-white">
                    {publications.filter(p => p.status === "CONFIRMED").length}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Pending</span>
                  <span className="font-bold text-white">
                    {publications.filter(p => p.status === "PENDING").length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-6">
            {/* Filters */}
            <div className="rounded-lg border border-white bg-black p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="search" className="mb-2 block text-sm font-bold">
                    Search
                  </label>
                  <input
                    id="search"
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded border border-gray-700 bg-black px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
                    placeholder="Search by title or hash..."
                  />
                </div>
                <div>
                  <label htmlFor="status" className="mb-2 block text-sm font-bold">
                    Filter by Status
                  </label>
                  <select
                    id="status"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as PublicationStatus | "ALL")}
                    className="w-full rounded border border-gray-700 bg-black px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
                  >
                    <option value="ALL">All</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="PENDING">Pending</option>
                    <option value="FAILED">Failed</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Publications List */}
            <div className="space-y-4">
              {filteredPublications.length === 0 ? (
                <div className="rounded-lg border border-gray-700 bg-black p-12 text-center">
                  <p className="text-gray-400">No publications found</p>
                </div>
              ) : (
                filteredPublications.map((pub) => (
                  <div key={pub.id} className="rounded-lg border border-white bg-black p-6">
                    <div className="mb-4 flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-white">{pub.title}</h3>
                        <p className="mt-1 text-sm text-gray-400">{pub.snippet}</p>
                      </div>
                      <span className={`ml-4 rounded-full px-3 py-1 text-xs font-bold ${
                        pub.status === "CONFIRMED" ? "bg-white text-black" :
                        pub.status === "PENDING" ? "border border-white bg-black text-white" :
                        "border border-gray-700 bg-black text-gray-400"
                      }`}>
                        {pub.status}
                      </span>
                    </div>

                    <div className="mb-4 space-y-2 text-xs">
                      <div>
                        <p className="text-gray-400">Content Hash</p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 truncate text-white">{pub.contentHash}</code>
                          <button
                            onClick={() => copyToClipboard(pub.contentHash)}
                            className="text-gray-400 hover:text-white"
                          >
                            Copy
                          </button>
                        </div>
                      </div>

                      {pub.txHash && (
                        <div>
                          <p className="text-gray-400">Transaction Hash</p>
                          <a
                            href={`https://etherscan.io/tx/${pub.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="truncate text-white hover:underline"
                          >
                            {pub.txHash}
                          </a>
                        </div>
                      )}

                      {pub.blockTimestamp && (
                        <div>
                          <p className="text-gray-400">Timestamp</p>
                          <p className="text-white">{new Date(pub.blockTimestamp).toLocaleString()}</p>
                        </div>
                      )}

                      {pub.parentHash && (
                        <div>
                          <p className="text-gray-400">Parent Hash (Version Link)</p>
                          <code className="truncate text-white">{pub.parentHash}</code>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/publication/${pub.id}`}
                        className="rounded border border-white bg-black px-3 py-1 text-xs font-bold text-white hover:bg-white hover:text-black"
                      >
                        View Details
                      </Link>
                      <button
                        onClick={() => copyToClipboard(pub.contentHash)}
                        className="rounded border border-gray-700 bg-black px-3 py-1 text-xs font-bold text-white hover:border-white"
                      >
                        Copy Hash
                      </button>
                      <button
                        onClick={() => downloadProof(pub)}
                        className="rounded border border-gray-700 bg-black px-3 py-1 text-xs font-bold text-white hover:border-white"
                      >
                        Download Proof
                      </button>
                      {pub.status === "CONFIRMED" && (
                        <Link
                          href={`/publish?parent=${pub.contentHash}`}
                          className="rounded border border-gray-700 bg-black px-3 py-1 text-xs font-bold text-white hover:border-white"
                        >
                          Create New Version
                        </Link>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
