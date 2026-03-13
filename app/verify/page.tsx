"use client";

import Link from "next/link";
import { useState } from "react";
import { sha256 } from "ethers";
import { verifyPublicationContent } from "@/lib/api-client";
import { useIsMobile } from "@/hooks/useIsMobile";

type InputMethod = "text" | "file" | "url";
type VerificationResult = {
  hash: string;
  matched: boolean;
  matches?: Array<{
    publicationId: string;
    publisher: string;
    timestamp: string;
    txHash: string;
    parentHash?: string;
    title?: string;
  }>;
};

const EXTENSION_MIME_MAP: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".bmp": "image/bmp",
  ".tiff": "image/tiff",
  ".ico": "image/x-icon",
  ".avif": "image/avif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".mkv": "video/x-matroska",
  ".avi": "video/x-msvideo",
  ".wmv": "video/x-ms-wmv",
  ".m4v": "video/x-m4v",
  ".mpeg": "video/mpeg",
  ".mpg": "video/mpeg",
  ".3gp": "video/3gpp",
};

function getFileExtension(fileName: string): string {
  const index = fileName.lastIndexOf(".");
  if (index === -1) return "";
  return fileName.slice(index).toLowerCase();
}

function resolveMimeType(file: File): string {
  const existing = (file.type || "").trim().toLowerCase();
  if (existing) return existing;
  const extension = getFileExtension(file.name);
  return EXTENSION_MIME_MAP[extension] || "application/octet-stream";
}

async function computeSha256Hex(bytes: Uint8Array): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (subtle?.digest) {
    const digestInput: ArrayBuffer = bytes.buffer instanceof ArrayBuffer
      ? bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
      : Uint8Array.from(bytes).buffer;
    const hashBuffer = await subtle.digest("SHA-256", digestInput);
    return Array.from(new Uint8Array(hashBuffer))
      .map((value) => value.toString(16).padStart(2, "0"))
      .join("");
  }

  // Fallback for environments where Web Crypto is unavailable.
  const digestWithPrefix = sha256(bytes);
  return digestWithPrefix.startsWith("0x") ? digestWithPrefix.slice(2) : digestWithPrefix;
}

export default function VerifyPage() {
  const isMobile = useIsMobile();
  const [inputMethod, setInputMethod] = useState<InputMethod>("text");
  const [textContent, setTextContent] = useState("");
  const [url, setUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [fileProgress, setFileProgress] = useState(0);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState("");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    setFileName(file.name);
    setError("");
    setResult(null);
    setIsLoadingFile(true);
    setFileProgress(0);

    try {
      const resolvedMimeType = resolveMimeType(file);
      const bytes = await file.arrayBuffer();
      setFileProgress(30);

      const hashHex = await computeSha256Hex(new Uint8Array(bytes));
      setFileProgress(60);

      const previewDataUrlRaw = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      setFileProgress(90);

      const previewDataUrl = previewDataUrlRaw.startsWith("data:application/octet-stream")
        && resolvedMimeType !== "application/octet-stream"
        ? previewDataUrlRaw.replace(/^data:application\/octet-stream/i, `data:${resolvedMimeType}`)
        : previewDataUrlRaw;

      // Use the same descriptor envelope as publish file uploads for hash parity.
      const fileDescriptorPayload = [
        `FILE:${file.name}`,
        `TYPE:${resolvedMimeType}`,
        `SIZE:${file.size}`,
        `SHA256:0x${hashHex}`,
        `DATAURL:${previewDataUrl}`,
      ].join("\n");

      setTextContent(fileDescriptorPayload);
      setFileProgress(100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process uploaded file");
    } finally {
      setIsLoadingFile(false);
    }
  };

  const handleComputeAndCheck = async () => {
    setIsProcessing(true);
    setError("");
    setResult(null);

    try {
      const data = await verifyPublicationContent({ content: textContent });
      setResult(data);
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : "Failed to verify content");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFetchFromUrl = async () => {
    if (!url) return;

    setIsFetchingUrl(true);
    setError("");
    setResult(null);

    try {
      const data = await verifyPublicationContent({
        sourceUrl: url,
        fetchFromUrl: true,
      });
      setResult(data);
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : "Failed to fetch and verify URL content");
    } finally {
      setIsFetchingUrl(false);
    }
  };

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

  if (isMobile) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-md space-y-5 px-4 py-8">
          <div className="space-y-3 border-b border-white pb-5">
            <Link href="/" className="text-sm text-gray-400 hover:text-white">
              ← Back to Home
            </Link>
            <h1 className="text-3xl font-bold">Verify Content</h1>
            <p className="text-sm text-gray-400">
              Check whether your content matches an on-chain proof-of-publish record.
            </p>
          </div>

          <div className="rounded-3xl border border-gray-700 p-4 text-sm text-gray-300">
            <span className="font-bold text-white">Privacy-first:</span> Canonicalization and hashing happen locally in your browser.
          </div>

          <div className="rounded-3xl border border-white p-5">
            <h2 className="text-lg font-bold">Input Method</h2>
            <div className="mt-4 grid grid-cols-3 gap-2 text-xs font-bold">
              <button
                onClick={() => setInputMethod("text")}
                className={inputMethod === "text" ? "rounded px-3 py-2 bg-white text-black" : "rounded border border-gray-700 px-3 py-2 text-white"}
              >
                Text
              </button>
              <button
                onClick={() => setInputMethod("file")}
                className={inputMethod === "file" ? "rounded px-3 py-2 bg-white text-black" : "rounded border border-gray-700 px-3 py-2 text-white"}
              >
                File
              </button>
              <button
                onClick={() => setInputMethod("url")}
                className={inputMethod === "url" ? "rounded px-3 py-2 bg-white text-black" : "rounded border border-gray-700 px-3 py-2 text-white"}
              >
                URL
              </button>
            </div>

            {inputMethod === "text" && (
              <div className="mt-4">
                <textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  className="w-full rounded border border-gray-700 bg-black px-3 py-3 font-mono text-sm text-white focus:border-white focus:outline-none"
                  rows={12}
                  placeholder="Paste your content here..."
                />
                <p className="mt-1 text-xs text-gray-400">{textContent.length} characters</p>
              </div>
            )}

            {inputMethod === "file" && (
              <div className="mt-4">
                <input
                  id="file-upload-mobile"
                  type="file"
                  onChange={handleFileUpload}
                  accept=".js,.ts,.jsx,.tsx,.py,.java,.c,.cpp,.h,.hpp,.cs,.go,.rs,.php,.rb,.sol,.json,.xml,.html,.css,.scss,.sh,.bat,.ps1,.md,.pdf,.doc,.docx,.txt,.rtf,.odt,image/*,audio/*,video/*"
                  className="hidden"
                  disabled={isLoadingFile}
                />
                <label htmlFor="file-upload-mobile" className={`flex cursor-pointer items-center justify-center rounded border px-4 py-8 text-center ${isLoadingFile ? "border-gray-700 cursor-not-allowed" : "border-gray-700 hover:border-white"}`}>
                  <div>
                    <p className="font-bold text-white">Click to upload</p>
                    <p className="mt-1 text-xs text-gray-400">{fileName || "Supports code, document, image, audio, and video files"}</p>
                  </div>
                </label>
                {isLoadingFile && (
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>Processing file...</span>
                      <span>{fileProgress}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-gray-800">
                      <div className="h-1.5 rounded-full bg-white transition-all duration-300" style={{ width: `${fileProgress}%` }} />
                    </div>
                  </div>
                )}
                {!isLoadingFile && textContent && <p className="mt-3 text-xs text-gray-400">File descriptor loaded ({textContent.length} characters)</p>}
              </div>
            )}

            {inputMethod === "url" && (
              <div className="mt-4 space-y-3">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full rounded border border-gray-700 bg-black px-3 py-3 text-white focus:border-white focus:outline-none"
                  placeholder="https://example.com/content"
                />
                <button
                  onClick={handleFetchFromUrl}
                  disabled={!url}
                  className="w-full rounded border border-white px-4 py-3 text-sm font-bold text-white hover:bg-white hover:text-black disabled:border-gray-700 disabled:text-gray-700"
                >
                  {isFetchingUrl ? "Fetching..." : "Fetch & Verify"}
                </button>
              </div>
            )}
          </div>

          <button
            onClick={handleComputeAndCheck}
            disabled={!textContent || isProcessing || isLoadingFile}
            className="w-full rounded-full bg-white px-6 py-3 font-bold text-black hover:bg-gray-200 disabled:bg-gray-800 disabled:text-gray-600"
          >
            {isProcessing ? "Processing..." : isLoadingFile ? "Waiting for file..." : "Compute & Check"}
          </button>

          <div className="rounded-3xl border border-white p-5">
            <h2 className="text-lg font-bold">Verification Result</h2>

            {!result && !error && (
              <div className="mt-4 rounded border border-gray-700 p-4 text-sm text-gray-400">
                Choose an input method, load your content, then run verification.
              </div>
            )}

            {error && (
              <div className="mt-4 rounded border border-white p-4 text-sm font-bold text-white">
                ⚠ {error}
              </div>
            )}

            {result && (
              <div className="mt-4 space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-bold">Computed Hash</label>
                  <code className="block break-all rounded border border-gray-700 px-3 py-3 font-mono text-xs text-white">
                    {result.hash}
                  </code>
                  <button
                    onClick={() => copyToClipboard(result.hash)}
                    className="mt-3 w-full rounded border border-white px-4 py-2 text-xs font-bold text-white hover:bg-white hover:text-black"
                  >
                    Copy Hash
                  </button>
                </div>

                <div className="rounded border border-gray-700 p-4">
                  <p className="text-sm font-bold text-white">On-chain Match</p>
                  <p className="mt-2 text-xs text-gray-300">{result.matched ? "Matched existing publication records." : "This content hash was not found in the registry."}</p>
                </div>

                {result.matched && result.matches && result.matches.length > 0 && (
                  <div className="space-y-3">
                    {result.matches.map((match, idx) => (
                      <div key={idx} className="rounded border border-gray-700 p-4 text-xs">
                        {match.title && <p className="mb-2 font-bold text-white">{match.title}</p>}
                        <p className="text-gray-400">Publisher</p>
                        <code className="block break-all text-white">{match.publisher}</code>
                        <p className="mt-2 text-gray-400">Timestamp</p>
                        <p className="text-white">{new Date(match.timestamp).toLocaleString()}</p>
                        <p className="mt-2 text-gray-400">Transaction Hash</p>
                        <code className="block break-all text-white">{match.txHash}</code>
                        {match.parentHash && (
                          <>
                            <p className="mt-2 text-gray-400">Parent Hash</p>
                            <code className="block break-all text-white">{match.parentHash}</code>
                          </>
                        )}
                        <Link href={`/publication/${match.publicationId}`} className="mt-3 inline-block font-bold text-white hover:underline">
                          View Full Details →
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-6 py-12 lg:px-12">
        {/* Header */}
        <div className="mb-8 border-b border-white pb-6">
          <Link href="/" className="text-sm text-gray-400 hover:text-white">
            ← Back to Home
          </Link>
          <h1 className="mt-2 text-3xl font-bold">Verify Content</h1>
          <p className="mt-1 text-sm text-gray-400">
            Check if content matches an on-chain proof-of-publish record
          </p>
        </div>

        {/* Info Banner */}
        <div className="mb-8 rounded-lg border border-gray-700 bg-black p-4">
          <p className="text-sm text-gray-300">
            <span className="font-bold">Privacy-first:</span> All canonicalization and hashing happens locally in your browser. 
            Content is never sent to any server until you explicitly choose to check against on-chain records.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          {/* Left: Input */}
          <div className="space-y-6">
            <div className="rounded-lg border border-white bg-black p-6">
              <h2 className="mb-4 text-xl font-bold">Input Method</h2>
              
              {/* Method Selector */}
              <div className="mb-6 flex flex-wrap gap-2">
                <button
                  onClick={() => setInputMethod("text")}
                  className={`min-w-[120px] flex-1 rounded px-4 py-2 text-sm font-bold ${
                    inputMethod === "text"
                      ? "bg-white text-black"
                      : "border border-gray-700 bg-black text-white hover:border-white"
                  }`}
                >
                  Paste Text
                </button>
                <button
                  onClick={() => setInputMethod("file")}
                  className={`min-w-[120px] flex-1 rounded px-4 py-2 text-sm font-bold ${
                    inputMethod === "file"
                      ? "bg-white text-black"
                      : "border border-gray-700 bg-black text-white hover:border-white"
                  }`}
                >
                  Upload File
                </button>
                <button
                  onClick={() => setInputMethod("url")}
                  className={`min-w-[120px] flex-1 rounded px-4 py-2 text-sm font-bold ${
                    inputMethod === "url"
                      ? "bg-white text-black"
                      : "border border-gray-700 bg-black text-white hover:border-white"
                  }`}
                >
                  Enter URL
                </button>
              </div>

              {/* Text Input */}
              {inputMethod === "text" && (
                <div>
                  <label htmlFor="text-content" className="mb-2 block text-sm font-bold">
                    Content to Verify
                  </label>
                  <textarea
                    id="text-content"
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    className="w-full rounded border border-gray-700 bg-black px-3 py-2 font-mono text-sm text-white focus:border-white focus:outline-none"
                    rows={14}
                    placeholder="Paste your content here..."
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    {textContent.length} characters
                  </p>
                </div>
              )}

              {/* File Upload */}
              {inputMethod === "file" && (
                <div>
                  <label htmlFor="file-upload" className="mb-2 block text-sm font-bold">
                    Upload File
                  </label>
                  <input
                    id="file-upload"
                    type="file"
                    onChange={handleFileUpload}
                    accept=".js,.ts,.jsx,.tsx,.py,.java,.c,.cpp,.h,.hpp,.cs,.go,.rs,.php,.rb,.sol,.json,.xml,.html,.css,.scss,.sh,.bat,.ps1,.md,.pdf,.doc,.docx,.txt,.rtf,.odt,image/*,audio/*,video/*"
                    className="hidden"
                    disabled={isLoadingFile}
                  />
                  <label
                    htmlFor="file-upload"
                    className={`flex cursor-pointer items-center justify-center rounded border bg-black px-4 py-8 text-center ${isLoadingFile ? "border-gray-700 cursor-not-allowed" : "border-gray-700 hover:border-white"}`}
                  >
                    <div>
                      <p className="font-bold text-white">Click to upload</p>
                      <p className="mt-1 text-xs text-gray-400">
                        {fileName || "Supports code, document, image, audio, and video files"}
                      </p>
                    </div>
                  </label>
                  {isLoadingFile && (
                    <div className="mt-3 space-y-1">
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>Processing file...</span>
                        <span>{fileProgress}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-gray-800">
                        <div className="h-1.5 rounded-full bg-white transition-all duration-300" style={{ width: `${fileProgress}%` }} />
                      </div>
                    </div>
                  )}
                  {!isLoadingFile && textContent && (
                    <div className="mt-4 rounded border border-gray-700 bg-black p-3">
                      <p className="text-xs text-gray-400">File descriptor loaded ({textContent.length} characters)</p>
                    </div>
                  )}
                </div>
              )}

              {/* URL Input */}
              {inputMethod === "url" && (
                <div>
                  <label htmlFor="url-input" className="mb-2 block text-sm font-bold">
                    Content URL
                  </label>
                  <input
                    id="url-input"
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full rounded border border-gray-700 bg-black px-3 py-2 text-white focus:border-white focus:outline-none"
                    placeholder="https://example.com/content"
                  />
                  <p className="mt-2 text-xs text-gray-400">
                    Content will be fetched from this URL with your consent
                  </p>
                  <button
                    onClick={handleFetchFromUrl}
                    disabled={!url}
                    className="mt-4 w-full rounded border border-white bg-black px-4 py-2 text-sm font-bold text-white hover:bg-white hover:text-black disabled:border-gray-700 disabled:text-gray-700 disabled:hover:bg-black"
                  >
                    {isFetchingUrl ? "Fetching..." : "Fetch & Verify"}
                  </button>
                </div>
              )}
            </div>

            {/* Action Button */}
            <button
              onClick={handleComputeAndCheck}
              disabled={!textContent || isProcessing || isLoadingFile}
              className="w-full rounded-full bg-white px-6 py-3 font-bold text-black hover:bg-gray-200 disabled:bg-gray-800 disabled:text-gray-600"
            >
              {isProcessing ? "Processing..." : isLoadingFile ? "Waiting for file..." : "Compute & Check"}
            </button>

            {/* What does hash match mean */}
            <div className="rounded-lg border border-gray-700 bg-black p-4">
              <h3 className="mb-2 text-sm font-bold">What does a hash match mean?</h3>
              <p className="text-xs text-gray-400">
                A hash match confirms that the exact content you provided was previously registered on-chain at a specific time by a specific publisher. 
                The hash is cryptographically unique, so even a single character difference would produce a completely different hash.
              </p>
            </div>
          </div>

          {/* Right: Results */}
          <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-lg border border-white bg-black p-6">
              <h2 className="mb-4 text-xl font-bold">Verification Result</h2>

              {!result && !error && (
                <div className="space-y-4 rounded border border-gray-700 bg-black p-5">
                  <div className="rounded border border-gray-700 bg-black p-4">
                    <p className="text-sm font-bold text-white">Ready to verify</p>
                    <p className="mt-1 text-xs text-gray-400">
                      Choose an input method, load your content, then run verification.
                    </p>
                  </div>

                  <div className="space-y-2 text-xs text-gray-300">
                    <p className="font-bold text-white">Quick flow</p>
                    <p>1. Paste text, upload a file, or enter a URL.</p>
                    <p>2. Click "Compute & Check" or "Fetch & Verify" for URL mode.</p>
                    <p>3. Review hash parity and any on-chain matches below.</p>
                  </div>

                  <div className="rounded border border-gray-700 bg-black p-3 text-xs text-gray-400">
                    Tip: uploaded files are converted to the same descriptor format used by publishing, so verification stays hash-consistent.
                  </div>
                </div>
              )}

              {error && (
                <div className="rounded border border-white bg-black p-4">
                  <p className="font-bold text-white">⚠ {error}</p>
                </div>
              )}

              {result && (
                <div className="space-y-4">
                  {/* Hash Display */}
                  <div>
                    <label className="mb-2 block text-sm font-bold">Computed Hash</label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 break-all rounded border border-gray-700 bg-black px-3 py-2 font-mono text-xs text-white">
                        {result.hash}
                      </code>
                      <button
                        onClick={() => copyToClipboard(result.hash)}
                        className="rounded border border-white bg-black px-3 py-2 text-xs font-bold text-white hover:bg-white hover:text-black"
                      >
                        Copy
                      </button>
                    </div>
                  </div>

                  {/* Match Status */}
                  <div className="rounded border border-gray-700 bg-black p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold">On-chain Match</span>
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                        result.matched 
                          ? "bg-white text-black" 
                          : "border border-white bg-black text-white"
                      }`}>
                        {result.matched ? "✓ MATCHED" : "✗ NO MATCH"}
                      </span>
                    </div>
                  </div>

                  {/* Matched Publications */}
                  {result.matched && result.matches && result.matches.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-bold">
                        Found {result.matches.length} {result.matches.length === 1 ? "Match" : "Matches"}
                      </h3>
                      
                      {result.matches.map((match, idx) => (
                        <div key={idx} className="rounded border border-gray-700 bg-black p-4">
                          {match.title && (
                            <p className="mb-2 truncate font-bold text-white" title={match.title}>{match.title}</p>
                          )}
                          
                          <div className="space-y-2 text-xs">
                            <div>
                              <p className="text-gray-400">Publisher</p>
                              <code className="block break-all text-white">{match.publisher}</code>
                            </div>
                            
                            <div>
                              <p className="text-gray-400">Timestamp</p>
                              <p className="text-white">{new Date(match.timestamp).toLocaleString()}</p>
                            </div>
                            
                            <div>
                              <p className="text-gray-400">Transaction Hash</p>
                              <code className="block break-all text-white">{match.txHash}</code>
                            </div>

                            {match.parentHash && (
                              <div>
                                <p className="text-gray-400">Parent Hash (Version)</p>
                                <code className="block break-all text-white">{match.parentHash}</code>
                              </div>
                            )}
                          </div>

                          <Link
                            href={`/publication/${match.publicationId}`}
                            className="mt-3 inline-block text-xs font-bold text-white hover:underline"
                          >
                            View Full Details →
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* No Match */}
                  {!result.matched && (
                    <div className="rounded border border-gray-700 bg-black p-4">
                      <p className="text-sm text-gray-300">
                        This content hash was not found in the on-chain registry.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
