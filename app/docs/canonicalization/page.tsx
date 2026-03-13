"use client";

import Link from "next/link";
import { useIsMobile } from "@/hooks/useIsMobile";

export default function CanonicalizationDocsPage() {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-md space-y-5 px-4 py-8">
          <div className="space-y-3 border-b border-white pb-5">
            <Link href="/" className="text-sm text-gray-400 hover:text-white">
              ← Back to Home
            </Link>
            <h1 className="text-3xl font-bold">Canonicalization Documentation</h1>
            <p className="text-sm text-gray-400">
              Deterministic content normalization rules for consistent hashing
            </p>
          </div>

          <section className="rounded-3xl border border-white p-5">
            <h2 className="text-xl font-bold">Why Canonicalization?</h2>
            <p className="mt-3 text-sm leading-6 text-gray-300">
              Invisible differences like whitespace, Unicode composition, and line endings change hashes. Canonicalization removes that drift so equivalent content hashes identically everywhere.
            </p>
          </section>

          <section className="rounded-3xl border border-white p-5">
            <h2 className="text-xl font-bold">Rules</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div className="rounded-2xl border border-gray-700 p-4">
                <p className="font-bold text-white">1. Boundary trimming</p>
                <p className="mt-2 text-gray-300">Remove leading and trailing blank lines and spaces from the full input.</p>
              </div>
              <div className="rounded-2xl border border-gray-700 p-4">
                <p className="font-bold text-white">2. Line ending normalization</p>
                <p className="mt-2 text-gray-300">Convert all endings to Unix-style LF.</p>
              </div>
              <div className="rounded-2xl border border-gray-700 p-4">
                <p className="font-bold text-white">3. Trailing whitespace removal</p>
                <p className="mt-2 text-gray-300">Strip trailing whitespace on every line.</p>
              </div>
              <div className="rounded-2xl border border-gray-700 p-4">
                <p className="font-bold text-white">4. Unicode normalization</p>
                <p className="mt-2 text-gray-300">Normalize text to NFC before hashing.</p>
              </div>
              <div className="rounded-2xl border border-gray-700 p-4">
                <p className="font-bold text-white">5. Metadata exclusion</p>
                <p className="mt-2 text-gray-300">Only canonicalized content is hashed; metadata stays separate.</p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-white p-5">
            <h2 className="text-xl font-bold">Reference Implementation</h2>
            <div className="mt-4 rounded-2xl border border-gray-700 bg-gray-900 p-4">
              <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-xs text-gray-300">
{`function canonicalize(content: string): string {
  return content
    .trim()
    .replace(/\\r\\n/g, "\\n")
    .replace(/\\s+$/gm, "")
    .normalize("NFC");
}`}
              </pre>
            </div>
          </section>

          <section className="rounded-3xl border border-gray-700 p-5">
            <h2 className="text-xl font-bold">Testing</h2>
            <p className="mt-3 text-sm text-gray-300">
              Verify your implementation with the built-in developer tools and dashboard seed commands.
            </p>
            <Link
              href="/dev-tools"
              className="mt-4 inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-bold text-black hover:bg-gray-200"
            >
              Go to Dev Tools
            </Link>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-4xl px-6 py-12 lg:px-12">
        {/* Header */}
        <div className="mb-8 border-b border-white pb-6">
          <Link href="/" className="text-sm text-gray-400 hover:text-white">
            ← Back to Home
          </Link>
          <h1 className="mt-2 text-3xl font-bold">Canonicalization Documentation</h1>
          <p className="mt-1 text-sm text-gray-400">
            Deterministic content normalization rules for consistent hashing
          </p>
        </div>

        <div className="space-y-8">
          {/* Introduction */}
          <section className="rounded-lg border border-white bg-black p-6">
            <h2 className="mb-4 text-2xl font-bold">Why Canonicalization?</h2>
            <p className="mb-4 text-gray-300">
              For content verification to work reliably, everyone must transform content the exact same way before hashing. 
              Without canonicalization, invisible differences (like line endings or whitespace) would produce completely different hashes 
              for what appears to be identical content.
            </p>
            <p className="text-gray-300">
              Our canonicalization rules are <span className="font-bold text-white">identical across frontend, backend, and verification tools</span> to 
              ensure hash consistency regardless of where or when the hash is computed.
            </p>
          </section>

          {/* Rules */}
          <section className="rounded-lg border border-white bg-black p-6">
            <h2 className="mb-4 text-2xl font-bold">Canonicalization Rules</h2>
            <div className="space-y-4">
              <div className="rounded border border-gray-700 bg-black p-4">
                <h3 className="mb-2 font-bold text-white">1. Boundary Trimming</h3>
                <p className="mb-2 text-sm text-gray-300">
                  Remove leading and trailing blank lines/spaces from the full input.
                </p>
                <div className="rounded bg-gray-900 p-3 font-mono text-xs">
                  <p className="text-gray-400">// Before:</p>
                  <p className="text-white">"\n\nHello\nWorld\n\n" → "Hello\nWorld"</p>
                </div>
              </div>

              <div className="rounded border border-gray-700 bg-black p-4">
                <h3 className="mb-2 font-bold text-white">2. Line Ending Normalization</h3>
                <p className="mb-2 text-sm text-gray-300">
                  Convert all line endings to Unix-style (LF / <code className="rounded bg-gray-900 px-1">\n</code>).
                </p>
                <div className="rounded bg-gray-900 p-3 font-mono text-xs">
                  <p className="text-gray-400">// Before:</p>
                  <p className="text-white">"Hello\r\nWorld" → "Hello\nWorld"</p>
                </div>
              </div>

              <div className="rounded border border-gray-700 bg-black p-4">
                <h3 className="mb-2 font-bold text-white">3. Trailing Whitespace Removal</h3>
                <p className="mb-2 text-sm text-gray-300">
                  Remove all trailing whitespace from each line.
                </p>
                <div className="rounded bg-gray-900 p-3 font-mono text-xs">
                  <p className="text-gray-400">// Before:</p>
                  <p className="text-white">"Hello   \nWorld  " → "Hello\nWorld"</p>
                </div>
              </div>

              <div className="rounded border border-gray-700 bg-black p-4">
                <h3 className="mb-2 font-bold text-white">4. Unicode Normalization (NFC)</h3>
                <p className="mb-2 text-sm text-gray-300">
                  Normalize all Unicode characters to NFC (Canonical Composition)
                </p>
                <div className="rounded bg-gray-900 p-3 font-mono text-xs">
                  <p className="text-gray-400">// Ensures é (U+00E9) and é (e + ◌́) produce the same hash</p>
                  <p className="text-white">content.normalize("NFC")</p>
                </div>
              </div>

              <div className="rounded border border-gray-700 bg-black p-4">
                <h3 className="mb-2 font-bold text-white">5. Metadata Field Exclusion</h3>
                <p className="mb-2 text-sm text-gray-300">
                  Only the content itself is hashed. Metadata like title, source URL, and timestamps are stored separately.
                </p>
                <div className="rounded bg-gray-900 p-3 font-mono text-xs">
                  <p className="text-gray-400">// Not included in hash: title, sourceUrl, contentType</p>
                  <p className="text-white">// Only hashed: canonicalized content text</p>
                </div>
              </div>
            </div>
          </section>

          {/* Complete Example */}
          <section className="rounded-lg border border-white bg-black p-6">
            <h2 className="mb-4 text-2xl font-bold">Complete Example</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="mb-2 text-sm font-bold text-gray-400">Original Input:</h3>
                <div className="rounded border border-gray-700 bg-gray-900 p-4 font-mono text-xs text-gray-300">
                  <pre className="whitespace-pre-wrap">
{`

Hello World!   
This is a test.  

More content here...

`}
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-sm font-bold text-gray-400">After Canonicalization:</h3>
                <div className="rounded border border-gray-700 bg-gray-900 p-4 font-mono text-xs text-white">
                  <pre className="whitespace-pre-wrap">
{`Hello World!
This is a test.

More content here...`}
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-sm font-bold text-gray-400">Resulting SHA-256 Hash:</h3>
                <div className="rounded border border-gray-700 bg-gray-900 p-4">
                  <code className="break-all font-mono text-xs text-white">
                    0xabcd1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab
                  </code>
                </div>
              </div>
            </div>
          </section>

          {/* Implementation */}
          <section className="rounded-lg border border-white bg-black p-6">
            <h2 className="mb-4 text-2xl font-bold">Reference Implementation</h2>
            <p className="mb-4 text-sm text-gray-300">
              This exact code runs in both frontend and backend:
            </p>
            <div className="rounded border border-gray-700 bg-gray-900 p-4">
              <pre className="overflow-x-auto font-mono text-xs text-gray-300">
{`function canonicalize(content: string): string {
  return content
    .trim()                        // 1. Trim leading/trailing lines
    .replace(/\\r\\n/g, "\\n")     // 2. Normalize line endings
    .replace(/\\s+$/gm, "")        // 3. Remove trailing whitespace
    .normalize("NFC");             // 4. Unicode normalization
}

async function computeHash(content: string): Promise<string> {
  const canonical = canonicalize(content);
  const encoder = new TextEncoder();
  const data = encoder.encode(canonical);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  return "0x" + hashHex;
}`}
              </pre>
            </div>
          </section>

          {/* Testing */}
          <section className="rounded-lg border border-gray-700 bg-black p-6">
            <h2 className="mb-4 text-2xl font-bold">Testing Your Implementation</h2>
            <p className="mb-4 text-sm text-gray-300">
              You can verify your canonicalization implementation using our dev tools:
            </p>
            <Link
              href="/dev-tools"
              className="inline-block rounded bg-white px-6 py-3 font-bold text-black hover:bg-gray-200"
            >
              Go to Dev Tools
            </Link>
          </section>

          {/* Important Notes */}
          <section className="rounded-lg border border-gray-700 bg-black p-6">
            <h2 className="mb-4 text-2xl font-bold">Important Notes</h2>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex gap-2">
                <span className="font-bold text-white">•</span>
                <span>
                  <span className="font-bold text-white">Consistency is critical:</span> Even minor deviations 
                  from these rules will produce completely different hashes.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-white">•</span>
                <span>
                  <span className="font-bold text-white">Browser compatibility:</span> We use standard Web APIs 
                  (TextEncoder, SubtleCrypto) supported in all modern browsers.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-white">•</span>
                <span>
                  <span className="font-bold text-white">No server dependency:</span> All canonicalization and 
                  hashing can happen offline in your browser for maximum privacy.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-white">•</span>
                <span>
                  <span className="font-bold text-white">Open source:</span> Our canonicalization code is 
                  publicly auditable and can be independently verified.
                </span>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}
