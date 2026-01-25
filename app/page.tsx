import Link from "next/link";

const primaryCtas = [
  { href: "/publish", label: "Publish", tone: "bg-white text-black hover:bg-gray-200" },
  { href: "/verify", label: "Verify", tone: "bg-white text-black hover:bg-gray-200" },
  { href: "/dashboard", label: "Dashboard", tone: "bg-black text-white border border-white hover:bg-gray-900" },
];

const quickLinks = [
  { href: "/docs/canonicalization", label: "Canonicalization docs" },
  { href: "/faq", label: "FAQ" },
  { href: "/dev-tools", label: "Dev Tools" },
];

const featureCards = [
  {
    title: "Publish with proofs",
    body: "Canonicalize your content, sign on-chain, and keep parent hashes to build verifiable version trees.",
    cta: "Go to Publish",
    href: "/publish",
  },
  {
    title: "Verify privately",
    body: "Hash locally in the browser with SubtleCrypto before any lookup. Nothing leaves the page until you choose to register.",
    cta: "Open Verify",
    href: "/verify",
  },
  {
    title: "Trace lineage",
    body: "Dashboards surface every version, parent-child links, tx hashes, and timestamps for full provenance.",
    cta: "View Dashboard",
    href: "/dashboard",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-16 px-6 pb-16 pt-20 lg:px-12 lg:pt-24">
        <header className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-white bg-black px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-white">
              On-chain proof of publish
            </span>
            <div className="space-y-4">
              <h1 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-6xl">
                Make content verifiable, forever.
              </h1>
              <p className="text-lg text-gray-300 sm:text-xl">
                Canonicalize, hash, and register any text or media with parent-aware versions. Publish, verify, and trace lineage—all without leaking content before you choose to sign.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {primaryCtas.map((cta) => (
                <Link
                  key={cta.href}
                  href={cta.href}
                  className={`inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-bold transition ${cta.tone}`}
                >
                  {cta.label}
                </Link>
              ))}
              <div className="flex items-center gap-4 text-sm text-gray-400">
                {quickLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="underline hover:text-white"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="w-full max-w-md rounded-lg border border-white bg-black p-6">
            <div className="mb-4 flex items-center justify-between text-sm">
              <span className="font-semibold text-white">Canonicalization</span>
              <span className="rounded-full border border-white bg-black px-3 py-1 text-xs font-bold text-white">Deterministic</span>
            </div>
            <div className="space-y-3 text-sm">
              <div className="rounded-lg border border-gray-700 bg-black p-4">
                <p className="font-bold text-white">Rules we enforce</p>
                <ul className="mt-2 space-y-1 text-slate-300">
                  <li>• Normalize whitespace, line endings, and Unicode</li>
                  <li>• Trim leading/trailing blank lines</li>
                  <li>• Ignore extraneous metadata fields</li>
                </ul>
              </div>
              <div className="rounded-lg border border-gray-700 bg-black p-4">
                <p className="font-bold text-white">Hash preview</p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <code className="truncate rounded border border-gray-700 bg-black px-2 py-1 text-xs font-mono text-white">0x5f2c…9ab4</code>
                  <button className="rounded-full border border-white bg-black px-3 py-1 text-xs font-bold text-white hover:bg-white hover:text-black">
                    Copy
                  </button>
                </div>
                <p className="mt-2 text-xs text-gray-400">Hashes are computed client-side via SubtleCrypto before any lookup.</p>
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-3">
          {featureCards.map((card) => (
            <div
              key={card.title}
              className="rounded-lg border border-white bg-black p-6 hover:bg-gray-900"
            >
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-white">{card.title}</h3>
                <p className="text-sm text-gray-300">{card.body}</p>
                <Link href={card.href} className="inline-flex items-center gap-2 text-sm font-bold text-white hover:underline">
                  {card.cta} →
                </Link>
              </div>
            </div>
          ))}
        </section>

        <section className="rounded-lg border border-white bg-black p-8 lg:grid lg:grid-cols-2 lg:gap-6">
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-white">Why canonicalization first?</h2>
            <p className="text-gray-300">
              Matching proofs only works when every party transforms content the exact same way. We run identical canonicalization in the frontend, backend, and on-chain references so hashes stay stable across time, networks, and clients.
            </p>
            <Link
              href="/docs/canonicalization"
              className="inline-flex items-center gap-2 rounded-full border border-white bg-black px-4 py-2 text-sm font-bold text-white hover:bg-white hover:text-black"
            >
              View canonicalization rules
            </Link>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:mt-0">
            <div className="rounded-lg border border-gray-700 bg-black p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-white">Privacy</p>
              <p className="mt-2 text-sm text-gray-300">Hashes compute locally; content stays client-side unless you sign.</p>
            </div>
            <div className="rounded-lg border border-gray-700 bg-black p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-white">Lineage</p>
              <p className="mt-2 text-sm text-gray-300">Parent hashes link versions, so provenance is auditable and fork-aware.</p>
            </div>
            <div className="rounded-lg border border-gray-700 bg-black p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-white">Integrity</p>
              <p className="mt-2 text-sm text-gray-300">Deterministic rules prevent accidental drift between publisher and verifier.</p>
            </div>
            <div className="rounded-lg border border-gray-700 bg-black p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-white">Speed</p>
              <p className="mt-2 text-sm text-gray-300">Lightweight frontend hashing keeps verification instant—even offline.</p>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-white bg-black p-8">
          <div className="space-y-4 text-center">
            <h2 className="text-xl font-bold text-white">Test it yourself</h2>
            <p className="text-gray-300">
              Use our developer tools to experiment with canonicalization and hash computation in real-time. 
              See exactly how your content is transformed before hashing.
            </p>
            <Link
              href="/dev-tools"
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-black hover:bg-gray-200"
            >
              Open Developer Tools →
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
