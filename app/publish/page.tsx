"use client";

import Link from "next/link";
import { useState } from "react";
import { useWallet } from "@/hooks/useWallet";

type ContentType = "text" | "article" | "code" | "document";
type PublishStatus = "idle" | "previewing" | "signing" | "pending" | "confirmed" | "failed";

export default function PublishPage() {
  const { isConnected, address, isLoading } = useWallet();
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [contentType, setContentType] = useState<ContentType>("text");
  const [sourceUrl, setSourceUrl] = useState("");
  const [parentHash, setParentHash] = useState("");
  
  const [status, setStatus] = useState<PublishStatus>("idle");
  const [canonicalizedContent, setCanonicalizedContent] = useState("");
  const [computedHash, setComputedHash] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  const [txHash, setTxHash] = useState("");
  const [blockTimestamp, setBlockTimestamp] = useState("");
  const [publicationId, setPublicationId] = useState("");
  const [error, setError] = useState("");

  const handlePreview = () => {
    setStatus("previewing");
    setError("");
    
    // Canonicalization logic (placeholder - will be implemented with actual crypto)
    const canonicalized = content
      .trim()
      .replace(/\r\n/g, "\n")
      .replace(/\s+$/gm, "")
      .normalize("NFC");
    
    setCanonicalizedContent(canonicalized);
    
    // Hash computation (placeholder - will use SubtleCrypto)
    const mockHash = `0x${Array.from({ length: 64 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join("")}`;
    
    setComputedHash(mockHash);
  };

  const handleSignAndRegister = () => {
    if (!canonicalizedContent || !computedHash) {
      setError("Please preview canonicalized content first");
      return;
    }
    setShowConfirmModal(true);
  };

  const confirmPublish = async () => {
    setShowConfirmModal(false);
    setStatus("signing");
    
    // Simulate wallet signing and transaction
    setTimeout(() => {
      setStatus("pending");
      setTxHash("0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef");
      
      setTimeout(() => {
        setStatus("confirmed");
        setBlockTimestamp(new Date().toISOString());
        setPublicationId("1");
      }, 3000);
    }, 1500);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
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
            <h1 className="mt-2 text-3xl font-bold">Publish Content</h1>
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
            <h1 className="mt-2 text-3xl font-bold">Publish Content</h1>
            <p className="mt-1 text-sm text-gray-400">
              Create a new proof-of-publish on-chain record
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
                  You need to connect your MetaMask wallet to publish content on-chain. 
                  This ensures you have ownership and can sign transactions.
                </p>
              </div>
              
              <Link
                href="/connect-wallet"
                className="inline-block rounded-full bg-white px-8 py-3 font-bold text-black hover:bg-gray-200"
              >
                Connect MetaMask Wallet
              </Link>

              <div className="mt-6 rounded-lg border border-gray-700 bg-black p-4 text-left">
                <h3 className="mb-2 text-sm font-bold">Why do I need to connect?</h3>
                <ul className="space-y-1 text-xs text-gray-400">
                  <li>• Sign transactions to register content hashes on-chain</li>
                  <li>• Prove authorship and timestamp of publications</li>
                  <li>• Maintain full custody of your cryptographic identity</li>
                  <li>• No content is uploaded - only hashes are stored</li>
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
            <h1 className="mt-2 text-3xl font-bold">Publish Content</h1>
            <p className="mt-1 text-sm text-gray-400">
              Create a new proof-of-publish on-chain record
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Connected Wallet</p>
            <code className="text-xs text-white">{address?.slice(0, 6)}...{address?.slice(-4)}</code>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Left Column: Form */}
          <div className="space-y-6">
            <div className="rounded-lg border border-white bg-black p-6">
              <h2 className="mb-4 text-xl font-bold">Content Details</h2>
              
              {/* Title */}
              <div className="mb-4">
                <label htmlFor="title" className="mb-2 block text-sm font-bold">
                  Title *
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded border border-gray-700 bg-black px-3 py-2 text-white focus:border-white focus:outline-none"
                  placeholder="Enter content title"
                />
              </div>

              {/* Content Type */}
              <div className="mb-4">
                <label htmlFor="contentType" className="mb-2 block text-sm font-bold">
                  Content Type *
                </label>
                <select
                  id="contentType"
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value as ContentType)}
                  className="w-full rounded border border-gray-700 bg-black px-3 py-2 text-white focus:border-white focus:outline-none"
                >
                  <option value="text">Plain Text</option>
                  <option value="article">Article</option>
                  <option value="code">Code</option>
                  <option value="document">Document</option>
                </select>
              </div>

              {/* Content Editor */}
              <div className="mb-4">
                <label htmlFor="content" className="mb-2 block text-sm font-bold">
                  Content *
                </label>
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full rounded border border-gray-700 bg-black px-3 py-2 font-mono text-sm text-white focus:border-white focus:outline-none"
                  rows={12}
                  placeholder="Enter or paste your content here..."
                />
                <p className="mt-1 text-xs text-gray-400">
                  {content.length} characters
                </p>
              </div>

              {/* Source URL (Optional) */}
              <div className="mb-4">
                <label htmlFor="sourceUrl" className="mb-2 block text-sm font-bold">
                  Source URL <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <input
                  id="sourceUrl"
                  type="url"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  className="w-full rounded border border-gray-700 bg-black px-3 py-2 text-white focus:border-white focus:outline-none"
                  placeholder="https://example.com/original-content"
                />
              </div>

              {/* Parent Hash (Optional) */}
              <div className="mb-4">
                <label htmlFor="parentHash" className="mb-2 block text-sm font-bold">
                  Parent Hash <span className="font-normal text-gray-400">(optional, for versioning)</span>
                </label>
                <input
                  id="parentHash"
                  type="text"
                  value={parentHash}
                  onChange={(e) => setParentHash(e.target.value)}
                  className="w-full rounded border border-gray-700 bg-black px-3 py-2 font-mono text-sm text-white focus:border-white focus:outline-none"
                  placeholder="0x..."
                />
                <p className="mt-1 text-xs text-gray-400">
                  Link this to a previous version by entering its hash
                </p>
              </div>

            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handlePreview}
                disabled={!title || !content || status === "signing" || status === "pending"}
                className="flex-1 rounded-full border border-white bg-black px-6 py-3 font-bold text-white hover:bg-white hover:text-black disabled:border-gray-700 disabled:text-gray-700 disabled:hover:bg-black"
              >
                Preview Canonicalized
              </button>
              <button
                onClick={handleSignAndRegister}
                disabled={!canonicalizedContent || status === "signing" || status === "pending" || status === "confirmed"}
                className="flex-1 rounded-full bg-white px-6 py-3 font-bold text-black hover:bg-gray-200 disabled:bg-gray-800 disabled:text-gray-600"
              >
                Sign & Register
              </button>
            </div>
          </div>

          {/* Right Column: Preview & Status */}
          <div className="space-y-6">
            {/* Preview Area */}
            <div className="rounded-lg border border-white bg-black p-6">
              <h2 className="mb-4 text-xl font-bold">Canonicalized Preview</h2>
              
              {canonicalizedContent ? (
                <>
                  <div className="mb-4 rounded border border-gray-700 bg-black p-4">
                    <pre className="whitespace-pre-wrap break-words font-mono text-sm text-gray-300">
                      {canonicalizedContent}
                    </pre>
                  </div>
                  
                  {/* Hash Display */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold">Computed Hash</label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 truncate rounded border border-gray-700 bg-black px-3 py-2 font-mono text-xs text-white">
                        {computedHash}
                      </code>
                      <button
                        onClick={() => copyToClipboard(computedHash)}
                        className="rounded border border-white bg-black px-3 py-2 text-xs font-bold text-white hover:bg-white hover:text-black"
                      >
                        Copy
                      </button>
                    </div>
                    <p className="text-xs text-gray-400">
                      SHA-256 hash computed client-side via SubtleCrypto
                    </p>
                  </div>
                </>
              ) : (
                <div className="rounded border border-gray-700 bg-black p-8 text-center text-gray-400">
                  <p>Click "Preview Canonicalized" to see normalized content and computed hash</p>
                </div>
              )}
            </div>

            {/* Status Display */}
            {status !== "idle" && status !== "previewing" && (
              <div className="rounded-lg border border-white bg-black p-6">
                <h2 className="mb-4 text-xl font-bold">Publication Status</h2>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold">Status</span>
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${
                      status === "confirmed" ? "border-white bg-white text-black" :
                      status === "failed" ? "border-white bg-black text-white" :
                      "border-gray-700 bg-black text-gray-400"
                    }`}>
                      {status.toUpperCase()}
                    </span>
                  </div>
                  
                  {txHash && (
                    <div className="rounded border border-gray-700 bg-black p-3">
                      <p className="mb-1 text-xs font-bold text-gray-400">Transaction Hash</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 truncate font-mono text-xs text-white">{txHash}</code>
                        <button
                          onClick={() => copyToClipboard(txHash)}
                          className="text-xs text-gray-400 hover:text-white"
                        >
                          Copy
                        </button>
                      </div>
                      <a
                        href={`https://etherscan.io/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-block text-xs text-white hover:underline"
                      >
                        View on Explorer →
                      </a>
                    </div>
                  )}
                  
                  {blockTimestamp && (
                    <div className="rounded border border-gray-700 bg-black p-3">
                      <p className="mb-1 text-xs font-bold text-gray-400">Block Timestamp</p>
                      <p className="text-sm text-white">{new Date(blockTimestamp).toLocaleString()}</p>
                    </div>
                  )}
                  
                  {publicationId && (
                    <div className="rounded border border-gray-700 bg-black p-3">
                      <p className="mb-1 text-xs font-bold text-gray-400">Publication ID</p>
                      <p className="text-sm text-white">#{publicationId}</p>
                    </div>
                  )}

                  {status === "confirmed" && (
                    <div className="mt-4 flex gap-2">
                      <Link
                        href={`/publication/${publicationId}`}
                        className="flex-1 rounded-full border border-white bg-black px-4 py-2 text-center text-sm font-bold text-white hover:bg-white hover:text-black"
                      >
                        View Details
                      </Link>
                      <Link
                        href="/dashboard"
                        className="flex-1 rounded-full border border-white bg-black px-4 py-2 text-center text-sm font-bold text-white hover:bg-white hover:text-black"
                      >
                        Go to Dashboard
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="rounded-lg border border-white bg-black p-4">
                <p className="text-sm font-bold text-white">⚠ {error}</p>
              </div>
            )}

            {/* Info Box */}
            <div className="rounded-lg border border-gray-700 bg-black p-4">
              <h3 className="mb-2 text-sm font-bold">How it works</h3>
              <ul className="space-y-2 text-xs text-gray-400">
                <li>• Content is canonicalized using deterministic rules</li>
                <li>• SHA-256 hash is computed locally in your browser</li>
                <li>• Your wallet signs the transaction with the hash</li>
                <li>• The hash is registered on-chain with metadata</li>
                <li>• Content never leaves your browser unless you choose to share</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="mx-4 w-full max-w-2xl rounded-lg border border-white bg-black p-6">
            <h2 className="mb-4 text-2xl font-bold">Confirm Publication</h2>
            
            <div className="mb-6 space-y-4">
              <div>
                <p className="mb-2 text-sm font-bold text-gray-400">Title</p>
                <p className="text-white">{title}</p>
              </div>
              
              <div>
                <p className="mb-2 text-sm font-bold text-gray-400">Content Type</p>
                <p className="text-white">{contentType}</p>
              </div>
              
              <div>
                <p className="mb-2 text-sm font-bold text-gray-400">Canonicalized Content Preview</p>
                <div className="max-h-48 overflow-y-auto rounded border border-gray-700 bg-black p-3">
                  <pre className="whitespace-pre-wrap break-words font-mono text-xs text-gray-300">
                    {canonicalizedContent.slice(0, 500)}
                    {canonicalizedContent.length > 500 && "..."}
                  </pre>
                </div>
              </div>
              
              <div>
                <p className="mb-2 text-sm font-bold text-gray-400">Hash to Register</p>
                <code className="block break-all rounded border border-gray-700 bg-black p-3 font-mono text-xs text-white">
                  {computedHash}
                </code>
              </div>

              {parentHash && (
                <div>
                  <p className="mb-2 text-sm font-bold text-gray-400">Parent Hash (Version Link)</p>
                  <code className="block break-all rounded border border-gray-700 bg-black p-3 font-mono text-xs text-white">
                    {parentHash}
                  </code>
                </div>
              )}
            </div>

            <div className="mb-4 rounded border border-gray-700 bg-black p-4">
              <p className="text-sm text-gray-400">
                By confirming, you will sign a transaction that registers this hash on-chain. 
                This action cannot be undone. The original content is NOT stored on-chain, 
                only the hash and metadata.
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 rounded-full border border-white bg-black px-6 py-3 font-bold text-white hover:bg-white hover:text-black"
              >
                Cancel
              </button>
              <button
                onClick={confirmPublish}
                className="flex-1 rounded-full bg-white px-6 py-3 font-bold text-black hover:bg-gray-200"
              >
                Confirm & Sign
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
