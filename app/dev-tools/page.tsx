"use client";

import Link from "next/link";
import { useState } from "react";
import { sha256 } from "ethers";
import { useIsMobile } from "@/hooks/useIsMobile";

export default function DevToolsPage() {
  const isMobile = useIsMobile();
  const [input, setInput] = useState("");
  const [canonicalized, setCanonicalized] = useState("");
  const [hash, setHash] = useState("");
  const [processing, setProcessing] = useState(false);

  const canonicalize = (content: string): string => {
    return content
      .trim()
      .replace(/\r\n/g, "\n")
      .replace(/\s+$/gm, "")
      .normalize("NFC");
  };

  const computeHash = async (content: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const subtle = globalThis.crypto?.subtle;

    if (subtle?.digest) {
      const hashBuffer = await subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
      return "0x" + hashHex;
    }

    // Fallback for environments where Web Crypto is unavailable.
    const digestWithPrefix = sha256(data);
    const hashHex = digestWithPrefix.startsWith("0x") ? digestWithPrefix.slice(2) : digestWithPrefix;
    return "0x" + hashHex;
  };

  const handleCompute = async () => {
    setProcessing(true);
    
    // Canonicalize
    const canonical = canonicalize(input);
    setCanonicalized(canonical);
    
    // Compute hash
    const hashResult = await computeHash(canonical);
    setHash(hashResult);
    
    setProcessing(false);
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

  const loadExample = () => {
    setInput(`
Hello World!   
This is a test.  

More content here...

`);
  };

  const reset = () => {
    setInput("");
    setCanonicalized("");
    setHash("");
  };

  if (isMobile) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-md space-y-5 px-4 py-8">
          <div className="space-y-3 border-b border-white pb-5">
            <Link href="/" className="text-sm text-gray-400 hover:text-white">
              ← Back to Home
            </Link>
            <h1 className="text-3xl font-bold">Developer Tools</h1>
            <p className="text-sm text-gray-400">
              Validate canonicalization and hashing with a mobile-friendly stacked view.
            </p>
          </div>

          <div className="rounded-3xl border border-gray-700 p-4 text-xs text-gray-300">
            <span className="font-bold text-white">Development Mode:</span> These tools stay aligned with the production publish and verify flows.
          </div>

          <div className="rounded-3xl border border-white p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold">Input Content</h2>
              <button
                onClick={loadExample}
                className="rounded border border-gray-700 px-3 py-1 text-xs font-bold text-white hover:border-white"
              >
                Load Example
              </button>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full rounded border border-gray-700 bg-black px-3 py-3 font-mono text-sm text-white focus:border-white focus:outline-none"
              rows={12}
              placeholder="Paste your content here to test canonicalization and hashing..."
            />
            <div className="mt-4 grid gap-2">
              <button
                onClick={handleCompute}
                disabled={!input || processing}
                className="rounded bg-white px-4 py-3 font-bold text-black hover:bg-gray-200 disabled:bg-gray-800 disabled:text-gray-600"
              >
                {processing ? "Processing..." : "Compute Hash"}
              </button>
              <button
                onClick={reset}
                className="rounded border border-white px-4 py-3 font-bold text-white hover:bg-white hover:text-black"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-700 p-5">
            <h3 className="text-sm font-bold">Input Statistics</h3>
            <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-gray-400">Characters</p>
                <p className="font-bold text-white">{input.length}</p>
              </div>
              <div>
                <p className="text-gray-400">Lines</p>
                <p className="font-bold text-white">{input.split("\n").length}</p>
              </div>
              <div>
                <p className="text-gray-400">Bytes</p>
                <p className="font-bold text-white">{new TextEncoder().encode(input).length}</p>
              </div>
              <div>
                <p className="text-gray-400">Words</p>
                <p className="font-bold text-white">{input.trim().split(/\s+/).filter((word) => word).length}</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white p-5">
            <h2 className="text-lg font-bold">Canonicalized Content</h2>
            {canonicalized ? (
              <>
                <div className="mt-4 rounded border border-gray-700 p-4">
                  <pre className="whitespace-pre-wrap break-words font-mono text-sm text-gray-300">{canonicalized}</pre>
                </div>
                <button
                  onClick={() => copyToClipboard(canonicalized)}
                  className="mt-4 w-full rounded border border-white px-4 py-3 text-xs font-bold text-white hover:bg-white hover:text-black"
                >
                  Copy Canonicalized Content
                </button>
              </>
            ) : (
              <div className="mt-4 rounded border border-gray-700 p-6 text-center text-sm text-gray-400">
                Canonicalized content will appear here
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-white p-5">
            <h2 className="text-lg font-bold">Computed Hash (SHA-256)</h2>
            {hash ? (
              <>
                <div className="mt-4 rounded border border-gray-700 p-4">
                  <code className="break-all font-mono text-sm text-white">{hash}</code>
                </div>
                <button
                  onClick={() => copyToClipboard(hash)}
                  className="mt-4 w-full rounded border border-white px-4 py-3 text-xs font-bold text-white hover:bg-white hover:text-black"
                >
                  Copy Hash
                </button>
              </>
            ) : (
              <div className="mt-4 rounded border border-gray-700 p-6 text-center text-sm text-gray-400">
                Hash will appear here
              </div>
            )}
          </div>

          <div className="grid gap-3">
            <Link href="/docs/canonicalization" className="rounded-2xl border border-white p-4 text-center hover:bg-white hover:text-black">
              Canonicalization Docs
            </Link>
            <Link href="/verify" className="rounded-2xl border border-white p-4 text-center hover:bg-white hover:text-black">
              Verify Content
            </Link>
            <Link href="/publish" className="rounded-2xl border border-white p-4 text-center hover:bg-white hover:text-black">
              Publish
            </Link>
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
          <h1 className="mt-2 text-3xl font-bold">Developer Tools</h1>
          <p className="mt-1 text-sm text-gray-400">
            Validate canonicalization and hashing, and test current dashboard/pagination behavior
          </p>
        </div>

        {/* Warning Banner */}
        <div className="mb-8 rounded-lg border border-gray-700 bg-black p-4">
          <p className="text-xs text-gray-400">
            <span className="font-bold text-white">Development Mode:</span> These tools are for testing and debugging.
            Canonicalization rules and SHA-256 hashing are aligned with the production publish and verify flows.
          </p>
        </div>

        <div className="mb-8 rounded-lg border border-gray-700 bg-black p-6">
          <h2 className="mb-3 text-lg font-bold">Current System Notes</h2>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>
              • Dashboard pagination is server-side (
              <code className="rounded bg-gray-900 px-1">page</code>,
              <code className="ml-1 rounded bg-gray-900 px-1">limit</code>,
              <code className="ml-1 rounded bg-gray-900 px-1">search</code>) and scoped to the connected wallet.
            </li>
            <li>• Publish requires canonicalized preview before signing/registering a publication.</li>
          </ul>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Input Section */}
          <div className="space-y-6">
            <div className="rounded-lg border border-white bg-black p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold">Input Content</h2>
                <button
                  onClick={loadExample}
                  className="rounded border border-gray-700 bg-black px-3 py-1 text-xs font-bold text-white hover:border-white"
                >
                  Load Example
                </button>
              </div>

              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="w-full rounded border border-gray-700 bg-black px-3 py-2 font-mono text-sm text-white focus:border-white focus:outline-none"
                rows={16}
                placeholder="Paste your content here to test canonicalization and hashing..."
              />

              <div className="mt-4 flex gap-2">
                <button
                  onClick={handleCompute}
                  disabled={!input || processing}
                  className="flex-1 rounded bg-white px-4 py-2 font-bold text-black hover:bg-gray-200 disabled:bg-gray-800 disabled:text-gray-600"
                >
                  {processing ? "Processing..." : "Compute Hash"}
                </button>
                <button
                  onClick={reset}
                  className="rounded border border-white bg-black px-4 py-2 font-bold text-white hover:bg-white hover:text-black"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="rounded-lg border border-gray-700 bg-black p-6">
              <h3 className="mb-3 text-sm font-bold">Input Statistics</h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-gray-400">Characters</p>
                  <p className="font-bold text-white">{input.length}</p>
                </div>
                <div>
                  <p className="text-gray-400">Lines</p>
                  <p className="font-bold text-white">{input.split("\n").length}</p>
                </div>
                <div>
                  <p className="text-gray-400">Bytes (UTF-8)</p>
                  <p className="font-bold text-white">{new TextEncoder().encode(input).length}</p>
                </div>
                <div>
                  <p className="text-gray-400">Words</p>
                  <p className="font-bold text-white">{input.trim().split(/\s+/).filter(w => w).length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Output Section */}
          <div className="space-y-6">
            {/* Canonicalized Output */}
            <div className="rounded-lg border border-white bg-black p-6">
              <h2 className="mb-4 text-xl font-bold">Canonicalized Content</h2>
              
              {canonicalized ? (
                <>
                  <div className="mb-4 rounded border border-gray-700 bg-black p-4">
                    <pre className="whitespace-pre-wrap break-words font-mono text-sm text-gray-300">
                      {canonicalized}
                    </pre>
                  </div>
                  <button
                    onClick={() => copyToClipboard(canonicalized)}
                    className="w-full rounded border border-white bg-black px-4 py-2 text-xs font-bold text-white hover:bg-white hover:text-black"
                  >
                    Copy Canonicalized Content
                  </button>
                </>
              ) : (
                <div className="rounded border border-gray-700 bg-black p-8 text-center text-gray-400">
                  <p className="text-sm">Canonicalized content will appear here</p>
                </div>
              )}
            </div>

            {/* Hash Output */}
            <div className="rounded-lg border border-white bg-black p-6">
              <h2 className="mb-4 text-xl font-bold">Computed Hash (SHA-256)</h2>
              
              {hash ? (
                <>
                  <div className="mb-4 rounded border border-gray-700 bg-black p-4">
                    <code className="break-all font-mono text-sm text-white">{hash}</code>
                  </div>
                  <button
                    onClick={() => copyToClipboard(hash)}
                    className="w-full rounded border border-white bg-black px-4 py-2 text-xs font-bold text-white hover:bg-white hover:text-black"
                  >
                    Copy Hash
                  </button>
                </>
              ) : (
                <div className="rounded border border-gray-700 bg-black p-8 text-center text-gray-400">
                  <p className="text-sm">Hash will appear here</p>
                </div>
              )}
            </div>

            {/* Changes Summary */}
            {canonicalized && input !== canonicalized && (
              <div className="rounded-lg border border-gray-700 bg-black p-6">
                <h3 className="mb-3 text-sm font-bold">Canonicalization Changes</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Original length:</span>
                    <span className="font-bold text-white">{input.length} chars</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Canonicalized length:</span>
                    <span className="font-bold text-white">{canonicalized.length} chars</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Bytes reduced:</span>
                    <span className="font-bold text-white">
                      {new TextEncoder().encode(input).length - new TextEncoder().encode(canonicalized).length} bytes
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Implementation Reference */}
        <div className="mt-8 rounded-lg border border-white bg-black p-6">
          <h2 className="mb-4 text-xl font-bold">Implementation Reference</h2>
          <p className="mb-4 text-sm text-gray-300">
            Canonicalization rules and SHA-256 output match production behavior (frontend uses Web Crypto, backend uses Node crypto):
          </p>
          <div className="rounded border border-gray-700 bg-gray-900 p-4">
            <pre className="overflow-x-auto font-mono text-xs text-gray-300">
{`function canonicalize(content: string): string {
  return content
    .trim()                         // Trim leading/trailing blank lines
    .replace(/\\r\\n/g, "\\n")      // Normalize line endings
    .replace(/\\s+$/gm, "")         // Remove trailing whitespace
    .normalize("NFC");             // Unicode normalization
}

async function computeHash(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  return "0x" + hashHex;
}`}
            </pre>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Link
            href="/docs/canonicalization"
            className="rounded border border-white bg-black p-4 text-center hover:bg-white hover:text-black"
          >
            <p className="font-bold">Canonicalization Docs</p>
            <p className="mt-1 text-xs text-gray-400">Full specification →</p>
          </Link>
          <Link
            href="/verify"
            className="rounded border border-white bg-black p-4 text-center hover:bg-white hover:text-black"
          >
            <p className="font-bold">Verify Content</p>
            <p className="mt-1 text-xs text-gray-400">Check on-chain →</p>
          </Link>
          <Link
            href="/publish"
            className="rounded border border-white bg-black p-4 text-center hover:bg-white hover:text-black"
          >
            <p className="font-bold">Publish</p>
            <p className="mt-1 text-xs text-gray-400">Register on-chain →</p>
          </Link>
        </div>
      </div>
    </main>
  );
}
