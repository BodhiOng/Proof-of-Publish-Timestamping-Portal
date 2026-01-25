import Link from "next/link";

const faqs = [
  {
    question: "What does a hash match mean?",
    answer: "A hash match means the exact content you're verifying was previously registered on-chain at a specific time by a specific wallet address. Since SHA-256 hashes are cryptographically unique, even a single character difference would produce a completely different hash. A match is mathematical proof that the content hasn't been altered since registration."
  },
  {
    question: "Is my content uploaded anywhere?",
    answer: "No. Your content is canonicalized and hashed entirely in your browser using JavaScript. Only the resulting hash (a 64-character hexadecimal string) is sent to the blockchain. The original content never leaves your device unless you explicitly choose to share it elsewhere. This design prioritizes privacy while still enabling verification."
  },
  {
    question: "Who controls the on-chain record?",
    answer: "The blockchain record is immutable and decentralized—no single party controls it. Once a transaction is confirmed, it becomes a permanent part of the blockchain's history. However, the wallet that signed the original transaction is recorded as the publisher, and only that wallet can create linked versions using the parent hash field."
  },
  {
    question: "Can I register somebody else's content?",
    answer: "Technically yes, since we only store hashes, not verify authorship. However, doing so doesn't give you any legal rights to that content. The blockchain timestamp proves when the hash was registered and by which wallet, but it does NOT prove original authorship or copyright. Always respect intellectual property laws and only register content you have rights to."
  },
  {
    question: "What happens if someone else registers the same content first?",
    answer: "The blockchain timestamp shows who registered first. If multiple wallets register the same content hash, all transactions are visible on-chain with their respective timestamps. The earliest timestamp provides the strongest claim of prior registration, but remember: blockchain timestamps are NOT legal proof of copyright ownership."
  },
  {
    question: "Can I delete or modify a publication after registering?",
    answer: "No. Blockchain transactions are immutable and permanent. Once a hash is registered, it cannot be deleted or modified. However, you can create a new version by publishing updated content with a parent hash pointing to the original. This creates a verifiable version chain while preserving the original record."
  },
  {
    question: "How much does it cost to publish?",
    answer: "Publishing requires paying blockchain transaction fees (gas fees). Costs vary based on network congestion. Typical Ethereum mainnet transactions might cost anywhere from $1 to $50+ in gas fees. There are no additional fees from our application—you only pay the network."
  },
  {
    question: "What networks are supported?",
    answer: "Currently, we support Ethereum mainnet. Support for Layer 2 solutions (like Polygon, Arbitrum, Optimism) and other EVM-compatible chains may be added in the future to reduce transaction costs while maintaining verification integrity."
  },
  {
    question: "How do version chains work?",
    answer: "When publishing, you can optionally specify a parent hash. This creates a cryptographic link to a previous publication, forming a version chain. Anyone can trace the lineage by following parent hash references. This enables verifiable content evolution while maintaining the integrity of each individual version."
  },
  {
    question: "What if I lose my wallet?",
    answer: "If you lose access to your wallet, you lose the ability to sign new transactions as that publisher. However, your existing publications remain on-chain and verifiable forever. You cannot transfer ownership of past publications to a new wallet. Always backup your wallet's seed phrase securely."
  },
  {
    question: "Is this legally binding proof of ownership?",
    answer: "No. A blockchain timestamp only proves WHEN a hash was registered and BY WHICH WALLET. It does not establish legal copyright ownership, authorship, or rights. Intellectual property law varies by jurisdiction and typically requires additional evidence. Use this tool as a supplementary timestamping mechanism, not as legal proof of ownership."
  },
  {
    question: "Can I verify content offline?",
    answer: "Partially. You can canonicalize and hash content offline using our open-source code. However, checking if that hash exists on-chain requires an internet connection to query the blockchain. For full offline verification, you'd need a local copy of the blockchain data."
  },
];

export default function FAQPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-4xl px-6 py-12 lg:px-12">
        {/* Header */}
        <div className="mb-8 border-b border-white pb-6">
          <Link href="/" className="text-sm text-gray-400 hover:text-white">
            ← Back to Home
          </Link>
          <h1 className="mt-2 text-3xl font-bold">Frequently Asked Questions</h1>
          <p className="mt-1 text-sm text-gray-400">
            Common questions about proof-of-publish and content verification
          </p>
        </div>

        {/* Legal Disclaimer */}
        <div className="mb-8 rounded-lg border border-white bg-black p-6">
          <h2 className="mb-3 text-lg font-bold">⚠ Important Legal Disclaimer</h2>
          <p className="text-sm text-gray-300">
            This tool provides cryptographic timestamping of content hashes on a blockchain. 
            It is <span className="font-bold text-white">NOT a substitute for legal proof of copyright, ownership, or authorship</span>. 
            Always comply with intellectual property laws in your jurisdiction. Registering someone else's content 
            without permission may violate copyright law, regardless of blockchain timestamps.
          </p>
        </div>

        {/* FAQs */}
        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <div key={index} className="rounded-lg border border-white bg-black p-6">
              <h3 className="mb-3 text-lg font-bold">{faq.question}</h3>
              <p className="text-sm leading-relaxed text-gray-300">{faq.answer}</p>
            </div>
          ))}
        </div>

        {/* Additional Resources */}
        <div className="mt-8 rounded-lg border border-gray-700 bg-black p-6">
          <h2 className="mb-4 text-lg font-bold">Additional Resources</h2>
          <div className="space-y-2">
            <Link
              href="/docs/canonicalization"
              className="block text-sm text-white hover:underline"
            >
              → Canonicalization Documentation
            </Link>
            <Link
              href="/dev-tools"
              className="block text-sm text-white hover:underline"
            >
              → Developer Tools
            </Link>
            <Link
              href="/verify"
              className="block text-sm text-white hover:underline"
            >
              → Verify Content
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
