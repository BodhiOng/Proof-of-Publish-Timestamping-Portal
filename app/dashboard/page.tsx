"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useWallet } from "@/hooks/useWallet";
import { getPublications as fetchPublications } from "@/lib/api-client";

type PublicationStatus = "PENDING" | "CONFIRMED" | "FAILED";
type Publication = {
  id: string;
  title: string;
  contentHash: string;
  canonicalizedContent: string;
  status: PublicationStatus;
  txHash?: string;
  blockTimestamp?: string;
  parentHash?: string;
};

export default function DashboardPage() {
  const { isConnected, address, isLoading, disconnect } = useWallet();
  
  const [publications, setPublications] = useState<Publication[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const loadPublications = useCallback(async (withSync = false) => {
    if (!address) return;

    try {
      setIsFetching(true);
      const data = await fetchPublications({
        wallet: address,
        limit: 100,
        sync: withSync,
      });

      setPublications(data.publications || []);
      setFetchError("");
    } catch (error) {
      setFetchError(error instanceof Error ? error.message : "Failed to load publications");
    } finally {
      setIsFetching(false);
    }
  }, [address]);

  useEffect(() => {
    if (!isConnected || !address) {
      setPublications([]);
      return;
    }

    loadPublications(true);
    const interval = window.setInterval(() => {
      loadPublications(true);
    }, 15000);

    return () => window.clearInterval(interval);
  }, [isConnected, address, loadPublications]);

  const filteredPublications = publications.filter((pub) => {
    const matchesSearch = 
      pub.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pub.contentHash.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getSnippet = (publication: Publication) => {
    const snippet = publication.canonicalizedContent?.slice(0, 120) || "";
    return snippet.length < (publication.canonicalizedContent?.length || 0) ? `${snippet}...` : snippet;
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

  // Loading state
  if (isLoading) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-12">
          <div className="mb-8 border-b border-white pb-6">
            <Link href="/" className="text-sm text-gray-400 hover:text-white">
              ← Back to Home
            </Link>
            <h1 className="mt-2 text-3xl font-bold">Dashboard</h1>
          </div>
          <div className="rounded-lg border border-white bg-black p-12 text-center">
            <p className="text-gray-400">Loading...</p>
          </div>
        </div>
      </main>
    );
  }

  // Not connected state
  if (!isConnected) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-12">
          <div className="mb-8 border-b border-white pb-6">
            <Link href="/" className="text-sm text-gray-400 hover:text-white">
              ← Back to Home
            </Link>
            <h1 className="mt-2 text-3xl font-bold">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-400">
              Manage your publications and view version chains
            </p>
          </div>
          
          <div className="mx-auto max-w-2xl">
            <div className="rounded-lg border border-white bg-black p-12 text-center">
              <div className="mb-6">
                <div className="mx-auto mb-4 h-16 w-16 rounded-full border-2 border-white bg-black p-4">
                  <svg className="h-full w-full text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h2 className="mb-3 text-2xl font-bold">Wallet Connection Required</h2>
                <p className="mb-6 text-gray-400">
                  You need to connect your MetaMask wallet to view your publications dashboard. 
                  Your publications are associated with your wallet address.
                </p>
              </div>
              
              <Link
                href="/connect-wallet"
                className="inline-block rounded-full bg-white px-8 py-3 font-bold text-black hover:bg-gray-200"
              >
                Connect MetaMask Wallet
              </Link>

              <div className="mt-6 rounded-lg border border-gray-700 bg-black p-4 text-left">
                <h3 className="mb-2 text-sm font-bold">What you'll see after connecting:</h3>
                <ul className="space-y-1 text-xs text-gray-400">
                  <li>• All your published content proofs</li>
                  <li>• Version chains and content lineage</li>
                  <li>• Search and filter your publications</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

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
              <div className="space-y-3">
                <div>
                  <p className="mb-1 text-xs text-gray-400">Connected Account</p>
                  <code className="block truncate text-xs text-white">{address}</code>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-white"></div>
                  <span className="text-xs font-bold">{isFetching ? "Syncing..." : "Connected"}</span>
                </div>
                <div className="grid gap-2">
                  <Link
                    href="/connect-wallet"
                    className="block w-full rounded border border-white bg-black px-4 py-2 text-center text-xs font-bold text-white hover:bg-white hover:text-black"
                  >
                    Manage Wallet
                  </Link>
                  <button
                    onClick={disconnect}
                    className="w-full rounded border border-gray-700 bg-black px-4 py-2 text-xs font-bold text-white hover:border-white"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="rounded-lg border border-gray-700 bg-black p-6">
              <h2 className="mb-4 text-lg font-bold">Statistics</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Total Publications</span>
                  <span className="font-bold text-white">{publications.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-6">
            {fetchError && (
              <div className="rounded-lg border border-white bg-black p-4">
                <p className="text-sm font-bold text-white">⚠ {fetchError}</p>
              </div>
            )}

            {/* Filters */}
            <div className="rounded-lg border border-white bg-black p-6">
              <div className="grid gap-4 md:grid-cols-1">
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
                    <div className="mb-4">
                      <h3 className="text-lg font-bold text-white">{pub.title}</h3>
                      <p className="mt-1 text-sm text-gray-400">{getSnippet(pub)}</p>
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
                          <p className="truncate text-white">{pub.txHash}</p>
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
