"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { getPublicationById } from "@/lib/api-client";

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
  status: string;
  nextVersion?: string | null;
  prevVersion?: string | null;
};

type ParsedFileDescriptor = {
  fileName?: string;
  mimeType?: string;
  sizeText?: string;
  sha256?: string;
  dataUrl?: string;
};

function parseFileDescriptor(content: string): ParsedFileDescriptor {
  const fileName = content.match(/FILE:(.+)/)?.[1]?.trim();
  const mimeType = content.match(/TYPE:(.+)/)?.[1]?.trim();
  const sizeText = content.match(/SIZE:(\d+)/)?.[1]?.trim();
  const sha256 = content.match(/SHA256:(0x[a-fA-F0-9]+)/)?.[1]?.trim();
  const dataUrl = content.match(/DATAURL:(data:[^\n]+)/)?.[1]?.trim();

  return { fileName, mimeType, sizeText, sha256, dataUrl };
}

function formatBytes(sizeText?: string): string {
  if (!sizeText) return "";
  const size = Number.parseInt(sizeText, 10);
  if (Number.isNaN(size)) return "";

  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = size;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function maskHash(value: string): string {
  if (!value) return "";
  if (value.length <= 18) return value;
  return `${value.slice(0, 10)}...${value.slice(-8)}`;
}

export default function PublicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [publication, setPublication] = useState<Publication | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPublication() {
      try {
        const data = await getPublicationById(id);
        setPublication(data);
        setLoading(false);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load publication";
        setError(message === "Publication not found" ? message : "Failed to load publication");
        setLoading(false);
      }
    }

    fetchPublication();
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-5xl px-6 py-12 lg:px-12">
          <div className="mb-8 border-b border-white pb-6">
            <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white">
              ← Back to Dashboard
            </Link>
          </div>
          <div className="rounded-lg border border-white bg-black p-12 text-center">
            <p className="text-gray-400">Loading publication...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !publication) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-5xl px-6 py-12 lg:px-12">
          <div className="mb-8 border-b border-white pb-6">
            <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white">
              ← Back to Dashboard
            </Link>
          </div>
          <div className="rounded-lg border border-white bg-black p-12 text-center">
            <h2 className="mb-4 text-2xl font-bold">Publication Not Found</h2>
            <p className="mb-6 text-gray-400">{error || "The publication you're looking for doesn't exist."}</p>
            <Link
              href="/dashboard"
              className="inline-block rounded-full bg-white px-6 py-3 font-bold text-black hover:bg-gray-200"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const parsedFile = parseFileDescriptor(publication.canonicalizedContent);
  const hasFileDescriptor = Boolean(parsedFile.fileName && parsedFile.mimeType);
  const canonicalizedContentDisplay = publication.canonicalizedContent
    .replace(/\n?DATAURL:data:[^\n]+/g, "")
    .trim();

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-6 py-12 lg:px-12">
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

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,2fr)_360px]">
          {/* Main Content */}
          <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            {/* Uploaded File Preview */}
            {hasFileDescriptor && (
              <div className="rounded-lg border border-white bg-black p-6">
                <h2 className="mb-4 text-xl font-bold">Uploaded File Preview</h2>

                <div className="mb-4 rounded border border-gray-700 bg-black p-4 text-sm">
                  <p className="text-white"><span className="font-bold text-gray-400">Name:</span> {parsedFile.fileName}</p>
                  <p className="text-white"><span className="font-bold text-gray-400">Type:</span> {parsedFile.mimeType}</p>
                  {parsedFile.sizeText && (
                    <p className="text-white"><span className="font-bold text-gray-400">Size:</span> {formatBytes(parsedFile.sizeText)}</p>
                  )}
                  {parsedFile.sha256 && (
                    <p className="mt-2 break-all font-mono text-xs text-gray-300">SHA-256: {parsedFile.sha256}</p>
                  )}
                </div>

                {!parsedFile.dataUrl && (
                  <div className="rounded border border-gray-700 bg-black p-4 text-sm text-gray-400">
                    Inline preview unavailable (file too large or not stored with inline data).
                  </div>
                )}

                {parsedFile.dataUrl && parsedFile.mimeType?.startsWith("image/") && (
                  <img
                    src={parsedFile.dataUrl}
                    alt={parsedFile.fileName || "Uploaded image"}
                    className="max-h-[420px] w-full rounded border border-gray-700 object-contain"
                  />
                )}

                {parsedFile.dataUrl && parsedFile.mimeType?.startsWith("audio/") && (
                  <audio controls src={parsedFile.dataUrl} className="w-full" />
                )}

                {parsedFile.dataUrl && parsedFile.mimeType?.startsWith("video/") && (
                  <video controls src={parsedFile.dataUrl} className="max-h-[420px] w-full rounded border border-gray-700" />
                )}

                {parsedFile.dataUrl && parsedFile.mimeType === "application/pdf" && (
                  <iframe
                    src={parsedFile.dataUrl}
                    title={parsedFile.fileName || "Uploaded PDF"}
                    className="h-[420px] w-full rounded border border-gray-700"
                  />
                )}

                {parsedFile.dataUrl && (
                  <div className="mt-4 flex justify-center">
                    <a
                      href={parsedFile.dataUrl}
                      download={parsedFile.fileName}
                      className="inline-block rounded border border-white bg-black px-4 py-2 text-sm font-bold text-white hover:bg-white hover:text-black"
                    >
                      Download Uploaded File
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Canonicalized Content */}
            <div className="rounded-lg border border-white bg-black p-6">
              <h2 className="mb-4 text-xl font-bold">Canonicalized Content</h2>
              <div className="rounded border border-gray-700 bg-black p-4">
                <pre className="whitespace-pre-wrap break-words font-mono text-sm text-gray-300">
                  {canonicalizedContentDisplay}
                </pre>
              </div>
              <div className="mt-3 flex justify-end">
                <a
                  href={`/api/publications/${publication.id}/content`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded border border-gray-700 bg-black px-3 py-1 text-xs font-bold text-white hover:border-white"
                >
                  Show Full Content
                </a>
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
                    <code className="flex-1 truncate text-white" title={publication.contentHash}>{maskHash(publication.contentHash)}</code>
                    <button
                      onClick={() => copyToClipboard(publication.contentHash)}
                      className="text-xs text-gray-400 hover:text-white"
                    >
                      Copy Full
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
                    <code className="flex-1 truncate text-white" title={publication.txHash}>{maskHash(publication.txHash)}</code>
                    <button
                      onClick={() => copyToClipboard(publication.txHash)}
                      className="text-xs text-gray-400 hover:text-white"
                    >
                      Copy Full
                    </button>
                  </div>
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
            <div className="rounded-lg border border-gray-700 bg-black p-6">
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
