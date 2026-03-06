"use client";

import Link from "next/link";
import { type MouseEvent, useCallback, useEffect, useRef, useState } from "react";
import { useWallet } from "@/hooks/useWallet";
import { deletePublication, getPublications as fetchPublications } from "@/lib/api-client";

const DEFAULT_PAGE_SIZE = 10;

type PublicationStatus = "PENDING" | "CONFIRMED" | "FAILED";
type Publication = {
  id: string;
  title: string;
  contentType: string;
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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [selectedPublicationIds, setSelectedPublicationIds] = useState<string[]>([]);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState("1");
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalPublications, setTotalPublications] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const pageCacheRef = useRef<Record<number, Publication[]>>({});
  const paginationCacheRef = useRef<{ total: number; totalPages: number } | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [searchTerm]);

  useEffect(() => {
    setPageInput(String(currentPage));
  }, [currentPage]);

  useEffect(() => {
    // Cache is only valid for the current wallet + search + page size context.
    pageCacheRef.current = {};
    paginationCacheRef.current = null;
  }, [address, debouncedSearchTerm, pageSize]);

  const loadPublications = useCallback(async (withSync = false) => {
    if (!address) return;

    if (!withSync) {
      const cachedPage = pageCacheRef.current[currentPage];
      if (cachedPage) {
        setPublications(cachedPage);
        if (paginationCacheRef.current) {
          setTotalPublications(paginationCacheRef.current.total);
          setTotalPages(paginationCacheRef.current.totalPages);
        }
        setFetchError("");
        return;
      }
    }

    try {
      setIsFetching(true);
      const data = await fetchPublications({
        wallet: address,
        search: debouncedSearchTerm || undefined,
        page: currentPage,
        limit: pageSize,
        sync: withSync,
      });

      const currentPublications = data.publications || [];
      const nextTotal = data.pagination?.total ?? 0;
      const nextTotalPages = data.pagination?.totalPages ?? 1;

      pageCacheRef.current[currentPage] = currentPublications;
      paginationCacheRef.current = {
        total: nextTotal,
        totalPages: nextTotalPages,
      };

      setPublications(currentPublications);
      setTotalPublications(nextTotal);
      setTotalPages(nextTotalPages);

      if (data.pagination && currentPage > data.pagination.totalPages && data.pagination.totalPages > 0) {
        setCurrentPage(data.pagination.totalPages);
      }

      // Prefetch the next page so paging stays snappy without loading all records at once.
      const nextPage = currentPage + 1;
      if (nextPage <= nextTotalPages && !pageCacheRef.current[nextPage]) {
        void fetchPublications({
          wallet: address,
          search: debouncedSearchTerm || undefined,
          page: nextPage,
          limit: pageSize,
          sync: false,
        })
          .then((prefetchData) => {
            pageCacheRef.current[nextPage] = prefetchData.publications || [];
          })
          .catch(() => {
            // Ignore prefetch failures; foreground fetches remain authoritative.
          });
      }

      setFetchError("");
    } catch (error) {
      setFetchError(error instanceof Error ? error.message : "Failed to load publications");
    } finally {
      setIsFetching(false);
    }
  }, [address, currentPage, pageSize, debouncedSearchTerm]);

  useEffect(() => {
    if (!isConnected || !address) {
      setPublications([]);
      setSelectedPublicationIds([]);
      setTotalPublications(0);
      setTotalPages(1);
      pageCacheRef.current = {};
      paginationCacheRef.current = null;
      return;
    }

    loadPublications(false);
  }, [isConnected, address, loadPublications]);

  useEffect(() => {
    if (!isConnected || !address) {
      return;
    }

    const interval = window.setInterval(() => {
      loadPublications(true);
    }, 15000);

    return () => window.clearInterval(interval);
  }, [isConnected, address, loadPublications]);

  const filteredIds = publications.map((publication) => publication.id);
  const hasSelections = selectedPublicationIds.length > 0;
  const allFilteredSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedPublicationIds.includes(id));
  const safeTotalPages = Math.max(totalPages, 1);
  const paginationStart = totalPublications === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const paginationEnd = Math.min(totalPublications, currentPage * pageSize);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getSnippet = (publication: Publication) => {
    const content = publication.canonicalizedContent || "";
    const descriptorFile = content.match(/FILE:(.+)/)?.[1]?.trim();
    const descriptorType = content.match(/TYPE:(.+)/)?.[1]?.trim();
    const descriptorSize = content.match(/SIZE:(\d+)/)?.[1]?.trim();

    const formatBytes = (sizeText?: string) => {
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
    };

    if (descriptorFile && descriptorType) {
      const sizeLabel = formatBytes(descriptorSize);
      const typeLabel = publication.contentType.toUpperCase();
      return `${typeLabel}: ${descriptorFile}${sizeLabel ? ` • ${sizeLabel}` : ""}`;
    }

    if (publication.contentType === "image") {
      return "Image entry";
    }
    if (publication.contentType === "audio") {
      return "Audio entry";
    }
    if (publication.contentType === "video") {
      return "Video entry";
    }

    const snippet = content.slice(0, 120);
    return snippet.length < content.length ? `${snippet}...` : snippet;
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

  const handleDeletePublication = async (publicationId: string) => {
    if (!address) {
      setFetchError("Wallet connection required to delete publications");
      return;
    }

    const shouldDelete = window.confirm("Delete this publication? This action cannot be undone.");
    if (!shouldDelete) {
      return;
    }

    try {
      setDeletingId(publicationId);
      await deletePublication(publicationId, address);
      setSelectedPublicationIds((current) => current.filter((id) => id !== publicationId));
      await loadPublications(true);
    } catch (error) {
      setFetchError(error instanceof Error ? error.message : "Failed to delete publication");
    } finally {
      setDeletingId(null);
    }
  };

  const toggleSelection = (publicationId: string) => {
    setSelectedPublicationIds((current) =>
      current.includes(publicationId)
        ? current.filter((id) => id !== publicationId)
        : [...current, publicationId]
    );
  };

  const handleSelectAllFiltered = () => {
    if (allFilteredSelected) {
      setSelectedPublicationIds((current) => current.filter((id) => !filteredIds.includes(id)));
      return;
    }

    setSelectedPublicationIds((current) => Array.from(new Set([...current, ...filteredIds])));
  };

  const toggleSelectMode = () => {
    setIsSelectMode((current) => {
      const next = !current;
      if (!next) {
        setSelectedPublicationIds([]);
      }
      return next;
    });
  };

  const handleDeleteSelected = async () => {
    if (!address) {
      setFetchError("Wallet connection required to delete publications");
      return;
    }

    if (!hasSelections) {
      return;
    }

    const shouldDelete = window.confirm(`Delete ${selectedPublicationIds.length} selected publication(s)? This action cannot be undone.`);
    if (!shouldDelete) {
      return;
    }

    try {
      setIsBulkDeleting(true);
      const idsToDelete = [...selectedPublicationIds];

      for (const publicationId of idsToDelete) {
        await deletePublication(publicationId, address);
      }

      setSelectedPublicationIds([]);
      await loadPublications(true);
    } catch (error) {
      setFetchError(error instanceof Error ? error.message : "Failed to delete selected publications");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handlePageJump = () => {
    const parsed = Number.parseInt(pageInput, 10);
    if (Number.isNaN(parsed)) {
      setPageInput(String(currentPage));
      return;
    }

    const clamped = Math.min(safeTotalPages, Math.max(1, parsed));
    setCurrentPage(clamped);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderReturnToTopButton = () => {
    if (!showScrollTop) {
      return null;
    }

    return (
      <button
        type="button"
        onClick={scrollToTop}
        className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-white bg-black text-white shadow-lg transition hover:bg-white hover:text-black"
        aria-label="Return to top"
        title="Return to top"
      >
        <span aria-hidden="true" className="text-xl leading-none">↑</span>
      </button>
    );
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
        {renderReturnToTopButton()}
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
        {renderReturnToTopButton()}
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

        <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)]">
          {/* Sidebar */}
          <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
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
                  <span className="font-bold text-white">{totalPublications}</span>
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
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full rounded border border-gray-700 bg-black px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
                    placeholder="Search by title or hash..."
                  />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={toggleSelectMode}
                  className="rounded border border-white bg-black px-3 py-1 text-xs font-bold text-white hover:bg-white hover:text-black"
                >
                  {isSelectMode ? "Done" : "Select"}
                </button>

                {isSelectMode && (
                  <>
                <button
                  onClick={handleSelectAllFiltered}
                  className="rounded border border-white bg-black px-3 py-1 text-xs font-bold text-white hover:bg-white hover:text-black"
                >
                  {allFilteredSelected ? "Unselect" : "All"}
                </button>
                <button
                  onClick={handleDeleteSelected}
                  disabled={!hasSelections || isBulkDeleting}
                  className="rounded border border-gray-700 bg-black px-3 py-1 text-xs font-bold text-white hover:border-white disabled:border-gray-800 disabled:text-gray-600"
                >
                  {isBulkDeleting ? "Deleting..." : `Delete (${selectedPublicationIds.length})`}
                </button>
                  </>
                )}
              </div>
            </div>

            {/* Publications List */}
            <div className="space-y-4">
              {publications.length === 0 ? (
                <div className="rounded-lg border border-gray-700 bg-black p-12 text-center">
                  <p className="text-gray-400">{isFetching ? "Loading publications..." : "No publications found"}</p>
                </div>
              ) : (
                publications.map((pub) => (
                  <div
                    key={pub.id}
                    className={`relative rounded-lg border border-white bg-black p-6 transition-colors ${isSelectMode ? "cursor-pointer hover:bg-white/5" : ""}`}
                    onClick={(event: MouseEvent<HTMLDivElement>) => {
                      if (!isSelectMode) {
                        return;
                      }

                      const target = event.target as HTMLElement;
                      if (target.closest("button,a,input,textarea,select,label,summary,details")) {
                        return;
                      }

                      toggleSelection(pub.id);
                    }}
                  >
                    {isSelectMode && (
                      <input
                        type="checkbox"
                        checked={selectedPublicationIds.includes(pub.id)}
                        onClick={(event) => event.stopPropagation()}
                        onChange={() => toggleSelection(pub.id)}
                        className="absolute left-6 top-8 h-4 w-4 accent-white"
                        aria-label={`Select publication ${pub.title}`}
                      />
                    )}

                    <div className={isSelectMode ? "pl-10" : ""}>
                      <div className="mb-4">
                        <h3 className="text-lg font-bold text-white">{pub.title}</h3>
                        <p className="mt-1 text-sm text-gray-400">{getSnippet(pub)}</p>
                      </div>

                      <div className="mb-4 space-y-2 text-xs">
                        <div>
                          <div className="mb-1 flex items-center gap-2">
                            <p className="text-gray-400">Content Hash</p>
                          </div>
                          <div className="flex items-center justify-between gap-2">
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

                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <Link
                          href={`/publication/${pub.id}`}
                          className="rounded border border-white bg-black px-3 py-1 text-xs font-bold text-white hover:bg-white hover:text-black"
                        >
                          View Details
                        </Link>

                        <details className="relative">
                          <summary className="cursor-pointer list-none rounded border border-gray-700 bg-black px-3 py-1 text-xs font-bold text-white hover:border-white">
                            More
                          </summary>
                          <div className="absolute right-0 z-10 mt-2 min-w-[180px] space-y-1 rounded border border-gray-700 bg-black p-2">
                            {pub.status === "CONFIRMED" && (
                              <Link
                                href={`/publish?parent=${pub.contentHash}`}
                                className="block rounded px-2 py-1 text-xs text-white hover:bg-white hover:text-black"
                              >
                                Create New Version
                              </Link>
                            )}
                            <button
                              onClick={() => handleDeletePublication(pub.id)}
                              disabled={deletingId === pub.id || isBulkDeleting}
                              className="block w-full rounded px-2 py-1 text-left text-xs text-white hover:bg-white hover:text-black disabled:text-gray-600"
                            >
                              {deletingId === pub.id ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        </details>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="rounded-lg border border-gray-700 bg-black p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <p className="text-xs text-gray-400">
                  Showing {paginationStart}-{paginationEnd} of {totalPublications}
                </p>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <label htmlFor="pageSize" className="text-gray-400">Per page</label>
                  <select
                    id="pageSize"
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number.parseInt(e.target.value, 10));
                      setCurrentPage(1);
                    }}
                    className="rounded border border-gray-700 bg-black px-2 py-1 text-white focus:border-white focus:outline-none"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>

                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage <= 1 || isFetching}
                    className="rounded border border-gray-700 bg-black px-3 py-1 text-xs font-bold text-white hover:border-white disabled:border-gray-800 disabled:text-gray-600"
                    title="First page"
                    aria-label="First page"
                  >
                    «
                  </button>

                  <button
                    onClick={() => setCurrentPage((current) => Math.max(1, current - 1))}
                    disabled={currentPage <= 1 || isFetching}
                    className="rounded border border-gray-700 bg-black px-3 py-1 text-xs font-bold text-white hover:border-white disabled:border-gray-800 disabled:text-gray-600"
                  >
                    Prev
                  </button>

                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={pageInput}
                    onChange={(e) => setPageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handlePageJump();
                      }
                    }}
                    onBlur={handlePageJump}
                    className="w-16 rounded border border-gray-700 bg-black px-2 py-1 text-center text-white focus:border-white focus:outline-none"
                    aria-label="Page number"
                  />
                  <span className="text-gray-400">/ {safeTotalPages}</span>

                  <button
                    onClick={() => setCurrentPage((current) => Math.min(safeTotalPages, current + 1))}
                    disabled={currentPage >= totalPages || isFetching}
                    className="rounded border border-gray-700 bg-black px-3 py-1 text-xs font-bold text-white hover:border-white disabled:border-gray-800 disabled:text-gray-600"
                  >
                    Next
                  </button>

                  <button
                    onClick={() => setCurrentPage(safeTotalPages)}
                    disabled={currentPage >= totalPages || isFetching}
                    className="rounded border border-gray-700 bg-black px-3 py-1 text-xs font-bold text-white hover:border-white disabled:border-gray-800 disabled:text-gray-600"
                    title="Last page"
                    aria-label="Last page"
                  >
                    »
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {renderReturnToTopButton()}
    </main>
  );
}
