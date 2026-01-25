"use client";

import Link from "next/link";
import { use } from "react";

type Publication = {
  id: string;
  title: string;
  contentType: string;
  canonicalizedContent: string;
  sourceUrl?: string;
  publisherWallet: string;
  contentHash: string;
  parentHash?: string;
  txHash: string;
  blockTimestamp: string;
  nextVersion?: string;
  prevVersion?: string;
};

// Mock data - would come from API/blockchain
const mockPublication: Publication = {
  id: "1",
  title: "Example Publication",
  contentType: "article",
  canonicalizedContent: `This is the canonicalized content of the publication.

It has been normalized according to the following rules:
- Line endings converted to \\n
- Trailing whitespace removed
- Unicode normalized to NFC form
- Leading/trailing blank lines trimmed

This ensures the hash remains consistent across platforms.`,
  sourceUrl: "https://example.com/original",
  publisherWallet: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
  contentHash: "0xabcd1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab",
  parentHash: "0x1111222233334444555566667777888899990000aaaabbbbccccddddeeeeffff",
  txHash: "0xdef4567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  blockTimestamp: new Date(Date.now() - 86400000).toISOString(),
  prevVersion: "0",
  nextVersion: "2",
};

export default function PublicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const publication = mockPublication; // In real app, fetch based on id

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const downloadProofPackage = () => {
    const proofPackage = {
      publication: {
        id: publication.id,
        title: publication.title,
        contentType: publication.contentType,
        publisherWallet: publication.publisherWallet,
        contentHash: publication.contentHash,
        parentHash: publication.parentHash,
        txHash: publication.txHash,
        blockTimestamp: publication.blockTimestamp,
      },
      canonicalizedContent: publication.canonicalizedContent,
      canonicalizationSteps: [
        "1. Convert line endings to \\n",
        "2. Remove trailing whitespace from each line",
        "3. Normalize Unicode to NFC",
        "4. Trim leading/trailing blank lines",
      ],
      verificationInstructions: "Hash the canonicalizedContent using SHA-256 and compare with contentHash",
    };

    const blob = new Blob([JSON.stringify(proofPackage, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `proof-package-${publication.id}.json`;
    a.click();
  };

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-5xl px-6 py-12 lg:px-12">
        {/* Header */}
        <div className="mb-8 border-b border-white pb-6">
          <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white">
            ← Back to Dashboard
          </Link>
          <h1 className="mt-2 text-3xl font-bold">{publication.title}</h1>
          <p className="mt-1 text-sm text-gray-400">
            Publication #{publication.id}
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_350px]">
          {/* Main Content */}
          <div className="space-y-6">
            {/* Canonicalized Content */}
            <div className="rounded-lg border border-white bg-black p-6">
              <h2 className="mb-4 text-xl font-bold">Canonicalized Content</h2>
              <div className="rounded border border-gray-700 bg-black p-4">
                <pre className="whitespace-pre-wrap break-words font-mono text-sm text-gray-300">
                  {publication.canonicalizedContent}
                </pre>
              </div>
            </div>

            {/* Content Metadata */}
            <div className="rounded-lg border border-white bg-black p-6">
              <h2 className="mb-4 text-xl font-bold">Content Metadata</h2>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-[120px_1fr] gap-2">
                  <span className="font-bold text-gray-400">Title:</span>
                  <span className="text-white">{publication.title}</span>
                </div>
                <div className="grid grid-cols-[120px_1fr] gap-2">
                  <span className="font-bold text-gray-400">Content Type:</span>
                  <span className="text-white">{publication.contentType}</span>
                </div>
                {publication.sourceUrl && (
                  <div className="grid grid-cols-[120px_1fr] gap-2">
                    <span className="font-bold text-gray-400">Source URL:</span>
                    <a
                      href={publication.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate text-white hover:underline"
                    >
                      {publication.sourceUrl}
                    </a>
                  </div>
                )}
                <div className="grid grid-cols-[120px_1fr] gap-2">
                  <span className="font-bold text-gray-400">Publisher:</span>
                  <code className="truncate text-white">{publication.publisherWallet}</code>
                </div>
                <div className="grid grid-cols-[120px_1fr] gap-2">
                  <span className="font-bold text-gray-400">Content Hash:</span>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 truncate text-white">{publication.contentHash}</code>
                    <button
                      onClick={() => copyToClipboard(publication.contentHash)}
                      className="text-xs text-gray-400 hover:text-white"
                    >
                      Copy
                    </button>
                  </div>
                </div>
                {publication.parentHash && (
                  <div className="grid grid-cols-[120px_1fr] gap-2">
                    <span className="font-bold text-gray-400">Parent Hash:</span>
                    <code className="truncate text-white">{publication.parentHash}</code>
                  </div>
                )}
              </div>
            </div>

            {/* On-chain Information */}
            <div className="rounded-lg border border-white bg-black p-6">
              <h2 className="mb-4 text-xl font-bold">On-chain Information</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="mb-1 font-bold text-gray-400">Transaction Hash</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 truncate text-white">{publication.txHash}</code>
                    <button
                      onClick={() => copyToClipboard(publication.txHash)}
                      className="text-xs text-gray-400 hover:text-white"
                    >
                      Copy
                    </button>
                  </div>
                  <a
                    href={`https://etherscan.io/tx/${publication.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-xs text-white hover:underline"
                  >
                    View on Etherscan →
                  </a>
                </div>
                <div>
                  <p className="mb-1 font-bold text-gray-400">Block Timestamp</p>
                  <p className="text-white">{new Date(publication.blockTimestamp).toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Version Navigation */}
            {(publication.prevVersion || publication.nextVersion) && (
              <div className="rounded-lg border border-gray-700 bg-black p-6">
                <h2 className="mb-4 text-xl font-bold">Version Chain</h2>
                <div className="flex items-center gap-4">
                  {publication.prevVersion ? (
                    <Link
                      href={`/publication/${publication.prevVersion}`}
                      className="flex-1 rounded border border-white bg-black px-4 py-2 text-center text-sm font-bold text-white hover:bg-white hover:text-black"
                    >
                      ← Previous Version
                    </Link>
                  ) : (
                    <div className="flex-1 rounded border border-gray-700 bg-black px-4 py-2 text-center text-sm font-bold text-gray-700">
                      No Previous Version
                    </div>
                  )}
                  {publication.nextVersion ? (
                    <Link
                      href={`/publication/${publication.nextVersion}`}
                      className="flex-1 rounded border border-white bg-black px-4 py-2 text-center text-sm font-bold text-white hover:bg-white hover:text-black"
                    >
                      Next Version →
                    </Link>
                  ) : (
                    <div className="flex-1 rounded border border-gray-700 bg-black px-4 py-2 text-center text-sm font-bold text-gray-700">
                      No Next Version
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <div className="rounded-lg border border-white bg-black p-6">
              <h2 className="mb-4 text-lg font-bold">Actions</h2>
              <div className="space-y-2">
                <button
                  onClick={downloadProofPackage}
                  className="w-full rounded bg-white px-4 py-2 text-sm font-bold text-black hover:bg-gray-200"
                >
                  Download Proof Package
                </button>
                <Link
                  href={`/publish?parent=${publication.contentHash}`}
                  className="block w-full rounded border border-white bg-black px-4 py-2 text-center text-sm font-bold text-white hover:bg-white hover:text-black"
                >
                  Create New Version
                </Link>
                <Link
                  href="/verify"
                  className="block w-full rounded border border-white bg-black px-4 py-2 text-center text-sm font-bold text-white hover:bg-white hover:text-black"
                >
                  Verify Content
                </Link>
              </div>
            </div>

            {/* Quick Info */}
            <div className="rounded-lg border border-gray-700 bg-black p-6">
              <h2 className="mb-4 text-lg font-bold">Quick Info</h2>
              <div className="space-y-3 text-xs">
                <div>
                  <p className="font-bold text-gray-400">Status</p>
                  <span className="mt-1 inline-block rounded-full bg-white px-3 py-1 text-xs font-bold text-black">
                    CONFIRMED
                  </span>
                </div>
                <div>
                  <p className="font-bold text-gray-400">Publication ID</p>
                  <p className="text-white">#{publication.id}</p>
                </div>
                <div>
                  <p className="font-bold text-gray-400">Has Version Link</p>
                  <p className="text-white">{publication.parentHash ? "Yes" : "No"}</p>
                </div>
              </div>
            </div>

            {/* Verification Instructions */}
            <div className="rounded-lg border border-gray-700 bg-black p-4">
              <h3 className="mb-2 text-sm font-bold">How to Verify</h3>
              <ol className="list-decimal space-y-1 pl-4 text-xs text-gray-400">
                <li>Copy the canonicalized content</li>
                <li>Compute SHA-256 hash locally</li>
                <li>Compare with the content hash above</li>
                <li>Check transaction on blockchain explorer</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
