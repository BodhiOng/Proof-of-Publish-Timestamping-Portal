"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { deletePublication, getAccountProfile, getPublicationById, type AccountProfile } from "@/lib/api-client";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useWallet } from "@/hooks/useWallet";

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

const MAX_CANONICALIZED_PREVIEW_BYTES_BY_TYPE: Record<"audio" | "video", number> = {
  audio: 20 * 1024 * 1024,
  video: 50 * 1024 * 1024,
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

function parseBytes(sizeText?: string): number | null {
  if (!sizeText) return null;
  const parsed = Number.parseInt(sizeText, 10);
  return Number.isNaN(parsed) ? null : parsed;
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
  const router = useRouter();
  const { isConnected, address } = useWallet();
  const { id } = use(params);
  const isMobile = useIsMobile();
  const [publication, setPublication] = useState<Publication | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newChildVersionId, setNewChildVersionId] = useState<string | null>(null);
  const [publisherProfile, setPublisherProfile] = useState<AccountProfile | null>(null);
  const [isLoadingPublisherProfile, setIsLoadingPublisherProfile] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchPublication(initialLoad = false) {
      try {
        const data = await getPublicationById(id);

        if (!isMounted) {
          return;
        }

        setPublication((current) => {
          // Trigger popup only when a child version appears while viewing this page.
          if (current && !current.nextVersion && data.nextVersion) {
            setNewChildVersionId(data.nextVersion);
          }

          return data;
        });

        if (initialLoad) {
          setLoading(false);
          setError(null);
        }
      } catch (err) {
        if (!isMounted) {
          return;
        }

        const message = err instanceof Error ? err.message : "Failed to load publication";
        if (initialLoad) {
          setError(message === "Publication not found" ? message : "Failed to load publication");
          setLoading(false);
        }
      }
    }

    fetchPublication(true);

    const intervalId = window.setInterval(() => {
      if (document.visibilityState !== "visible") {
        return;
      }

      fetchPublication(false);
    }, 8000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [id]);

  useEffect(() => {
    if (!newChildVersionId) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setNewChildVersionId(null);
    }, 10000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [newChildVersionId]);

  useEffect(() => {
    if (!publication?.publisherWallet) {
      setPublisherProfile(null);
      return;
    }

    let isMounted = true;
    setIsLoadingPublisherProfile(true);

    getAccountProfile(publication.publisherWallet)
      .then((data) => {
        if (!isMounted) return;
        setPublisherProfile(data.account);
      })
      .catch(() => {
        if (!isMounted) return;
        setPublisherProfile(null);
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoadingPublisherProfile(false);
      });

    return () => {
      isMounted = false;
    };
  }, [publication?.publisherWallet]);

  if (loading) {
    if (isMobile) {
      return (
        <main className="min-h-screen bg-black text-white">
          <div className="mx-auto max-w-md space-y-5 px-4 py-8">
            <div className="border-b border-white pb-5">
              <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white">
                ← Back to Dashboard
              </Link>
            </div>
            <div className="rounded-3xl border border-white p-8 text-center text-gray-400">Loading publication...</div>
          </div>
        </main>
      );
    }

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
    if (isMobile) {
      return (
        <main className="min-h-screen bg-black text-white">
          <div className="mx-auto max-w-md space-y-5 px-4 py-8">
            <div className="border-b border-white pb-5">
              <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white">
                ← Back to Dashboard
              </Link>
            </div>
            <div className="rounded-3xl border border-white p-8 text-center">
              <h2 className="text-2xl font-bold">Publication Not Found</h2>
              <p className="mt-3 text-sm text-gray-400">{error || "The publication you're looking for doesn't exist."}</p>
              <Link href="/dashboard" className="mt-5 inline-flex rounded-full bg-white px-5 py-3 text-sm font-bold text-black hover:bg-gray-200">
                Go to Dashboard
              </Link>
            </div>
          </div>
        </main>
      );
    }

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

  const copyToClipboard = async (text: string) => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return;
      }

      if (typeof document !== "undefined") {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.setAttribute("readonly", "");
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.select();

        const copied = document.execCommand("copy");
        document.body.removeChild(textArea);

        if (copied) {
          return;
        }
      }

      throw new Error("Clipboard API unavailable");
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
      if (typeof window !== "undefined") {
        window.alert("Copy failed. Please copy the value manually.");
      }
    }
  };

  const downloadCanonicalizedDocumentText = () => {
    const fileBaseName = (publication.title || "publication-document")
      .trim()
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "publication-document";

    const blob = new Blob([publication.canonicalizedContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${fileBaseName}.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const downloadCanonicalizedContentText = () => {
    const fileBaseName = (publication.title || "canonicalized-content")
      .trim()
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "canonicalized-content";

    const blob = new Blob([canonicalizedContentDisplay], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${fileBaseName}-canonicalized.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const parsedFile = parseFileDescriptor(publication.canonicalizedContent);
  const canDelete = Boolean(
    isConnected
    && address
    && publication.publisherWallet
    && address.trim().toLowerCase() === publication.publisherWallet.trim().toLowerCase()
  );
  const hasFileDescriptor = Boolean(parsedFile.fileName && parsedFile.mimeType);
  const isDocumentPublication = publication.contentType === "document";
  const isCodePublication = publication.contentType === "code";
  const useDownloadOnlyFileSection = isDocumentPublication || isCodePublication;
  const isAudioOrVideoPublication = publication.contentType === "audio" || publication.contentType === "video";
  const audioOrVideoType = publication.contentType === "audio" || publication.contentType === "video"
    ? publication.contentType
    : null;
  const parsedFileSizeBytes = parseBytes(parsedFile.sizeText);
  const canonicalizedPreviewLimit = audioOrVideoType
    ? MAX_CANONICALIZED_PREVIEW_BYTES_BY_TYPE[audioOrVideoType]
    : null;
  const isCanonicalizedPreviewTooLarge =
    isAudioOrVideoPublication
    && parsedFileSizeBytes !== null
    && canonicalizedPreviewLimit !== null
    && parsedFileSizeBytes > canonicalizedPreviewLimit;
  const canonicalizedContentDisplay = publication.canonicalizedContent
    .replace(/\n?DATAURL:data:[^\n]+/g, "")
    .trim();
  const useScrollableCanonicalizedWindow = publication.contentType === "text" || publication.contentType === "article";

  const handleDeletePublication = async () => {
    if (!canDelete || !address || isDeleting) {
      return;
    }

    const shouldDelete = window.confirm(
      "Delete this publication? This action cannot be undone."
    );

    if (!shouldDelete) {
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await deletePublication(publication.id, address);
      router.push("/dashboard");
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete publication");
      setIsDeleting(false);
    }
  };

  if (isMobile) {
    return (
      <main className="min-h-screen bg-black text-white">
        {newChildVersionId && (
          <div className="sticky top-3 z-50 mx-4 rounded-3xl border border-white bg-black p-4 shadow-xl">
            <p className="text-sm font-bold text-white">New Child Version Detected</p>
            <p className="mt-1 text-xs text-gray-400">This publication just received a new child in the version chain.</p>
            <div className="mt-3 grid gap-2">
              <Link href={`/publication/${newChildVersionId}`} className="rounded border border-white px-4 py-3 text-center text-sm font-bold text-white hover:bg-white hover:text-black">
                Open Child Version
              </Link>
              <button onClick={() => setNewChildVersionId(null)} className="rounded border border-gray-700 px-4 py-3 text-sm font-bold text-white hover:border-white">
                Dismiss
              </button>
            </div>
          </div>
        )}

        <div className="mx-auto max-w-md space-y-5 px-4 py-8">
          <div className="space-y-3 border-b border-white pb-5">
            <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white">
              ← Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold">{publication.title}</h1>
            <p className="text-sm text-gray-400">Publication #{publication.id}</p>
          </div>

          {hasFileDescriptor && useDownloadOnlyFileSection && parsedFile.dataUrl && (
            <section className="rounded-3xl border border-white p-5">
              <h2 className="text-lg font-bold">File Download</h2>
              <div className="mt-4 grid gap-2">
                <a href={parsedFile.dataUrl} download={parsedFile.fileName} className="rounded border border-white px-4 py-3 text-center text-sm font-bold text-white hover:bg-white hover:text-black">
                  {isDocumentPublication ? "Download Document" : "Download Code File"}
                </a>
              </div>
            </section>
          )}

          {hasFileDescriptor && !useDownloadOnlyFileSection && (
            <section className="rounded-3xl border border-white p-5">
              <h2 className="text-lg font-bold">{isDocumentPublication ? "Uploaded File" : "Uploaded File Preview"}</h2>
              <div className="mt-4 rounded-2xl border border-gray-700 p-4 text-sm">
                <p className="text-white"><span className="font-bold text-gray-400">Name:</span> <span className="break-all">{parsedFile.fileName}</span></p>
                <p className="mt-2 text-white"><span className="font-bold text-gray-400">Type:</span> <span className="break-all">{parsedFile.mimeType}</span></p>
                {parsedFile.sizeText && <p className="mt-2 text-white"><span className="font-bold text-gray-400">Size:</span> {formatBytes(parsedFile.sizeText)}</p>}
              </div>
              {!parsedFile.dataUrl && (
                <div className="mt-4 rounded border border-gray-700 p-4 text-sm text-gray-400">
                  Inline preview unavailable for this publication.
                </div>
              )}
              {parsedFile.dataUrl && parsedFile.mimeType?.startsWith("image/") && (
                <img src={parsedFile.dataUrl} alt={parsedFile.fileName || "Uploaded image"} className="mt-4 w-full rounded border border-gray-700 object-contain" />
              )}
              {parsedFile.dataUrl && parsedFile.mimeType?.startsWith("audio/") && (
                <audio controls src={parsedFile.dataUrl} className="mt-4 w-full" />
              )}
              {parsedFile.dataUrl && parsedFile.mimeType?.startsWith("video/") && (
                <video controls src={parsedFile.dataUrl} className="mt-4 w-full rounded border border-gray-700" />
              )}
              {parsedFile.dataUrl && (
                <a href={parsedFile.dataUrl} download={parsedFile.fileName} className="mt-4 inline-flex w-full justify-center rounded border border-white px-4 py-3 text-sm font-bold text-white hover:bg-white hover:text-black">
                  {isDocumentPublication ? "Download Document" : publication.contentType === "code" ? "Download Code File" : "Download Uploaded File"}
                </a>
              )}
            </section>
          )}

          {isDocumentPublication && !hasFileDescriptor && (
            <section className="rounded-3xl border border-white p-5">
              <h2 className="text-lg font-bold">Document Download</h2>
              <p className="mt-3 text-sm text-gray-400">Original uploaded file is unavailable for this publication record.</p>
              <div className="mt-4 grid gap-2">
                <button onClick={downloadCanonicalizedDocumentText} className="rounded border border-white px-4 py-3 text-sm font-bold text-white hover:bg-white hover:text-black">
                  Download Document Text
                </button>
                <a href={`/api/publications/${publication.id}/content`} target="_blank" rel="noopener noreferrer" className="rounded border border-white px-4 py-3 text-center text-sm font-bold text-white hover:bg-white hover:text-black">
                  Open Full Content
                </a>
              </div>
            </section>
          )}

          <section className="rounded-3xl border border-white p-5">
            <h2 className="text-lg font-bold">Canonicalized Content</h2>
            <div className="mt-4 rounded border border-gray-700 p-4">
              {isCanonicalizedPreviewTooLarge ? (
                <p className="text-sm text-gray-300">Canonicalized content will not be previewed here because this {publication.contentType} upload is too large ({formatBytes(parsedFile.sizeText)}).</p>
              ) : (
                <div className={useScrollableCanonicalizedWindow ? "max-h-[280px] overflow-y-auto" : ""}>
                  <pre className="whitespace-pre-wrap break-words font-mono text-sm text-gray-300">{canonicalizedContentDisplay}</pre>
                </div>
              )}
            </div>
            <div className="mt-4 grid gap-2">
              {(publication.contentType === "text" || publication.contentType === "article") && (
                <button onClick={downloadCanonicalizedContentText} className="rounded border border-gray-700 px-4 py-3 text-sm font-bold text-white hover:border-white">
                  Download TXT
                </button>
              )}
              <a href={`/api/publications/${publication.id}/content`} target="_blank" rel="noopener noreferrer" className="rounded border border-gray-700 px-4 py-3 text-center text-sm font-bold text-white hover:border-white">
                Show Full Content
              </a>
            </div>
          </section>

          <section className="rounded-3xl border border-white p-5">
            <h2 className="text-lg font-bold">Content Metadata</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div><p className="text-xs font-bold text-gray-400">Title</p><p className="text-white">{publication.title}</p></div>
              <div><p className="text-xs font-bold text-gray-400">Content Type</p><p className="text-white">{publication.contentType}</p></div>
              {publication.sourceUrl && (
                <div>
                  <p className="text-xs font-bold text-gray-400">Source URL</p>
                  <a href={publication.sourceUrl} target="_blank" rel="noopener noreferrer" className="break-all text-white hover:underline">{publication.sourceUrl}</a>
                </div>
              )}
              <div>
                <p className="text-xs font-bold text-gray-400">Publisher</p>
                <code className="block break-all text-white">{publication.publisherWallet}</code>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400">Content Hash</p>
                <code className="block break-all text-white">{publication.contentHash}</code>
                <button onClick={() => copyToClipboard(publication.contentHash)} className="mt-1 text-xs text-gray-400 hover:text-white">Copy Full</button>
              </div>
              {publication.parentHash && (
                <div>
                  <p className="text-xs font-bold text-gray-400">Parent Hash</p>
                  <code className="block break-all text-white">{publication.parentHash}</code>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-white p-5">
            <h2 className="text-lg font-bold">On-chain Information</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div>
                <p className="text-xs font-bold text-gray-400">Transaction Hash</p>
                <code className="block break-all text-white">{publication.txHash}</code>
                <button onClick={() => copyToClipboard(publication.txHash)} className="mt-1 text-xs text-gray-400 hover:text-white">Copy Full</button>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400">Block Timestamp</p>
                <p className="text-white">{new Date(publication.blockTimestamp).toLocaleString()}</p>
              </div>
            </div>
          </section>

          {(publication.prevVersion || publication.nextVersion) && (
            <section className="rounded-3xl border border-gray-700 p-5">
              <h2 className="text-lg font-bold">Version Chain</h2>
              <div className="mt-4 grid gap-2">
                {publication.prevVersion ? (
                  <Link href={`/publication/${publication.prevVersion}`} className="rounded border border-white px-4 py-3 text-center text-sm font-bold text-white hover:bg-white hover:text-black">
                    ← Previous Version
                  </Link>
                ) : (
                  <div className="rounded border border-gray-700 px-4 py-3 text-center text-sm font-bold text-gray-700">No Previous Version</div>
                )}
                {publication.nextVersion ? (
                  <Link href={`/publication/${publication.nextVersion}`} className="rounded border border-white px-4 py-3 text-center text-sm font-bold text-white hover:bg-white hover:text-black">
                    Next Version →
                  </Link>
                ) : (
                  <div className="rounded border border-gray-700 px-4 py-3 text-center text-sm font-bold text-gray-700">No Next Version</div>
                )}
              </div>
            </section>
          )}

          <section className="rounded-3xl border border-gray-700 p-5">
            <h2 className="text-lg font-bold">Publisher Profile</h2>
            {isLoadingPublisherProfile ? (
              <p className="mt-3 text-xs text-gray-400">Loading publisher profile...</p>
            ) : publisherProfile ? (
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 overflow-hidden rounded-full border border-gray-700 bg-black">
                    {publisherProfile.avatarUrl ? (
                      <img src={publisherProfile.avatarUrl} alt={`${publisherProfile.displayName || publisherProfile.username} avatar`} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs font-bold text-gray-500">
                        {publisherProfile.username.slice(0, 2).toUpperCase() || "NA"}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-white">{publisherProfile.displayName || publisherProfile.username}</p>
                    <p className="text-xs text-gray-400">@{publisherProfile.username}</p>
                  </div>
                </div>
                {publisherProfile.bio && <p className="text-xs text-gray-300">{publisherProfile.bio}</p>}

                {(publisherProfile.website || publisherProfile.location) && (
                  <div className="flex flex-wrap gap-2">
                    {publisherProfile.website && (
                      <a
                        href={publisherProfile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full border border-gray-700 px-3 py-1 text-xs text-white hover:border-white"
                      >
                        🌐 Website
                      </a>
                    )}
                    {publisherProfile.location && (
                      <span className="rounded-full border border-gray-700 px-3 py-1 text-xs text-gray-300">
                        📍 {publisherProfile.location}
                      </span>
                    )}
                  </div>
                )}

                <div>
                  <p className="text-xs font-bold text-gray-400">Wallet</p>
                  <code className="block break-all text-xs text-white">{publication.publisherWallet}</code>
                </div>
              </div>
            ) : (
              <div className="mt-3 space-y-2 text-xs text-gray-400">
                <p>No account profile found for this publisher wallet.</p>
                <p className="text-xs font-bold text-gray-400">Wallet</p>
                <code className="block break-all text-white">{publication.publisherWallet}</code>
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-white p-5">
            <h2 className="text-lg font-bold">Actions</h2>
            <div className="mt-4 grid gap-2">
              <Link href={`/publish?parent=${publication.contentHash}`} className="rounded border border-white px-4 py-3 text-center text-sm font-bold text-white hover:bg-white hover:text-black">
                Create New Version
              </Link>
              <Link href="/verify" className="rounded border border-white px-4 py-3 text-center text-sm font-bold text-white hover:bg-white hover:text-black">
                Verify Content
              </Link>
              {canDelete && (
                <button
                  type="button"
                  onClick={handleDeletePublication}
                  disabled={isDeleting}
                  className="rounded border border-white px-4 py-3 text-sm font-bold text-white hover:bg-white hover:text-black disabled:border-gray-700 disabled:text-gray-700"
                >
                  {isDeleting ? "Deleting..." : "Delete Publication"}
                </button>
              )}
            </div>
            {deleteError && (
              <p className="mt-3 text-xs font-bold text-white">⚠ {deleteError}</p>
            )}
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      {newChildVersionId && (
        <div className="fixed bottom-6 right-6 z-50 w-full max-w-sm rounded-lg border border-white bg-black p-4 shadow-xl">
          <p className="text-sm font-bold text-white">New Child Version Detected</p>
          <p className="mt-1 text-xs text-gray-400">
            This publication just received a new child in the version chain.
          </p>
          <div className="mt-3 flex gap-2">
            <Link
              href={`/publication/${newChildVersionId}`}
              className="flex-1 rounded border border-white bg-black px-3 py-2 text-center text-xs font-bold text-white hover:bg-white hover:text-black"
            >
              Open Child Version
            </Link>
            <button
              type="button"
              onClick={() => setNewChildVersionId(null)}
              className="rounded border border-gray-700 bg-black px-3 py-2 text-xs font-bold text-white hover:border-white"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

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

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          {/* Main Content */}
          <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            {/* Uploaded File Preview */}
            {hasFileDescriptor && useDownloadOnlyFileSection && parsedFile.dataUrl && (
              <div className="rounded-lg border border-white bg-black p-6">
                <h2 className="mb-4 text-xl font-bold">File Download</h2>
                <div className="flex flex-wrap justify-center gap-3">
                  <a
                    href={parsedFile.dataUrl}
                    download={parsedFile.fileName}
                    className="inline-block rounded border border-white bg-black px-4 py-2 text-sm font-bold text-white hover:bg-white hover:text-black"
                  >
                    {isDocumentPublication ? "Download Document" : "Download Code File"}
                  </a>
                </div>
              </div>
            )}

            {hasFileDescriptor && !useDownloadOnlyFileSection && (
              <div className="rounded-lg border border-white bg-black p-6">
                <h2 className="mb-4 text-xl font-bold">{isDocumentPublication ? "Uploaded File" : "Uploaded File Preview"}</h2>

                <div className="mb-4 rounded border border-gray-700 bg-black p-4 text-sm">
                  <p className="text-white"><span className="font-bold text-gray-400">Name:</span> <span className="break-all">{parsedFile.fileName}</span></p>
                  <p className="text-white"><span className="font-bold text-gray-400">Type:</span> <span className="break-all">{parsedFile.mimeType}</span></p>
                  {parsedFile.sizeText && (
                    <p className="text-white"><span className="font-bold text-gray-400">Size:</span> {formatBytes(parsedFile.sizeText)}</p>
                  )}
                  {parsedFile.sha256 && (
                    <p className="mt-2 break-all font-mono text-xs text-gray-300">SHA-256: {parsedFile.sha256}</p>
                  )}
                </div>

                {!parsedFile.dataUrl && (
                  <div className="rounded border border-gray-700 bg-black p-4 text-sm text-gray-400">
                    Inline preview unavailable for this publication (inline file data not stored).
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

                {parsedFile.dataUrl && isDocumentPublication && (
                  <div className="mt-4 flex flex-wrap justify-center gap-3">
                    <a
                      href={parsedFile.dataUrl}
                      download={parsedFile.fileName}
                      className="inline-block rounded border border-white bg-black px-4 py-2 text-sm font-bold text-white hover:bg-white hover:text-black"
                    >
                      Download Document
                    </a>
                  </div>
                )}

                {parsedFile.dataUrl && !isDocumentPublication && (
                  <div className="mt-4 flex justify-center">
                    <a
                      href={parsedFile.dataUrl}
                      download={parsedFile.fileName}
                      className="inline-block rounded border border-white bg-black px-4 py-2 text-sm font-bold text-white hover:bg-white hover:text-black"
                    >
                      {publication.contentType === "code" ? "Download Code File" : "Download Uploaded File"}
                    </a>
                  </div>
                )}
              </div>
            )}

            {isDocumentPublication && !hasFileDescriptor && (
              <div className="rounded-lg border border-white bg-black p-6">
                <h2 className="mb-4 text-xl font-bold">Document Download</h2>
                <p className="mb-3 text-sm text-gray-400">
                  Original uploaded file is unavailable for this publication record.
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    onClick={downloadCanonicalizedDocumentText}
                    className="inline-block rounded border border-white bg-black px-4 py-2 text-sm font-bold text-white hover:bg-white hover:text-black"
                  >
                    Download Document Text
                  </button>
                  <a
                    href={`/api/publications/${publication.id}/content`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block rounded border border-white bg-black px-4 py-2 text-sm font-bold text-white hover:bg-white hover:text-black"
                  >
                    Open Full Content
                  </a>
                </div>
              </div>
            )}

            {/* Canonicalized Content */}
            <div className="rounded-lg border border-white bg-black p-6">
              <h2 className="mb-4 text-xl font-bold">Canonicalized Content</h2>
              <div className="rounded border border-gray-700 bg-black p-4">
                {isCanonicalizedPreviewTooLarge ? (
                  <p className="text-sm text-gray-300">
                    Canonicalized content will not be previewed here because this {publication.contentType} upload is too large ({formatBytes(parsedFile.sizeText)}). Use "Show Full Content" if needed.
                  </p>
                ) : (
                  <div className={useScrollableCanonicalizedWindow ? "max-h-[320px] overflow-y-auto" : ""}>
                    <pre className="whitespace-pre-wrap break-words font-mono text-sm text-gray-300">
                      {canonicalizedContentDisplay}
                    </pre>
                  </div>
                )}
              </div>
              <div className="mt-3 flex flex-wrap justify-end gap-2">
                {(publication.contentType === "text" || publication.contentType === "article") && (
                  <button
                    type="button"
                    onClick={downloadCanonicalizedContentText}
                    className="rounded border border-gray-700 bg-black px-3 py-1 text-xs font-bold text-white hover:border-white"
                  >
                    Download TXT
                  </button>
                )}
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
            <div className="rounded-lg border border-gray-700 bg-black p-6">
              <h2 className="mb-4 text-lg font-bold">Publisher Profile</h2>

              {isLoadingPublisherProfile ? (
                <p className="text-xs text-gray-400">Loading publisher profile...</p>
              ) : publisherProfile ? (
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 overflow-hidden rounded-full border border-gray-700 bg-black">
                      {publisherProfile.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={publisherProfile.avatarUrl}
                          alt={`${publisherProfile.displayName || publisherProfile.username} avatar`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs font-bold text-gray-500">
                          {publisherProfile.username.slice(0, 2).toUpperCase() || "NA"}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-white">{publisherProfile.displayName || publisherProfile.username}</p>
                      <p className="text-xs text-gray-400">@{publisherProfile.username}</p>
                    </div>
                  </div>

                  {publisherProfile.bio && (
                    <p className="truncate text-xs text-gray-300" title={publisherProfile.bio}>
                      {publisherProfile.bio}
                    </p>
                  )}

                  {(publisherProfile.website || publisherProfile.location) && (
                    <div className="flex flex-wrap gap-2">
                      {publisherProfile.website && (
                        <a
                          href={publisherProfile.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-full border border-gray-700 px-3 py-1 text-xs text-white hover:border-white"
                        >
                          🌐 Website
                        </a>
                      )}

                      {publisherProfile.location && (
                        <span className="rounded-full border border-gray-700 px-3 py-1 text-xs text-gray-300">
                          📍 {publisherProfile.location}
                        </span>
                      )}
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-bold text-gray-400">Wallet</p>
                    <code className="block break-all text-xs text-white">{publication.publisherWallet}</code>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-xs text-gray-400">
                  <p>No account profile found for this publisher wallet.</p>
                  <code className="block break-all text-white">{publication.publisherWallet}</code>
                </div>
              )}
            </div>

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
                {canDelete && (
                  <button
                    type="button"
                    onClick={handleDeletePublication}
                    disabled={isDeleting}
                    className="block w-full rounded border border-white bg-black px-4 py-2 text-center text-sm font-bold text-white hover:bg-white hover:text-black disabled:border-gray-700 disabled:text-gray-700"
                  >
                    {isDeleting ? "Deleting..." : "Delete Publication"}
                  </button>
                )}
              </div>
              {deleteError && <p className="mt-3 text-xs font-bold text-white">⚠ {deleteError}</p>}
            </div>

            {/* Quick Info */}
            <div className="rounded-lg border border-gray-700 bg-black p-6">
              <h2 className="mb-4 text-lg font-bold">Quick Info</h2>
              <div className="space-y-3 text-xs">
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
