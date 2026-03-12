"use client";

import Link from "next/link";
import { useIsMobile } from "@/hooks/useIsMobile";

const primaryCtas = [
  { href: "/publish", label: "Publish", tone: "bg-white text-black hover:bg-gray-200" },
  { href: "/verify", label: "Verify", tone: "bg-white text-black hover:bg-gray-200" },
  { href: "/dashboard", label: "Dashboard", tone: "bg-black text-white border border-white hover:bg-gray-900" },
];

const quickLinks = [
  { href: "/docs/canonicalization", label: "Canonicalization docs" },
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
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto flex max-w-md flex-col gap-8 px-4 py-8">
          <section className="rounded-3xl border border-red-500 bg-red-950/20 p-5">
            <h2 className="text-lg font-bold text-red-200">Mobile Browser Warning</h2>
            <p className="mt-2 text-sm leading-6 text-red-100">
              Some wallet actions rely on desktop browser extensions and may not work from a regular mobile browser.
            </p>
            <div className="mt-4 rounded-2xl border border-red-800 bg-red-950/30 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-200">Features unavailable on mobile browser</p>
              <ul className="mt-3 space-y-2 text-sm text-red-100">
                <li>• Publish</li>
                <li>• Wallet/Account</li>
              </ul>
            </div>
            <p className="mt-4 text-sm text-red-100">
              For full wallet and account functionality, switch to the desktop web client and connect through your browser extension. The rest of the app can still be used on mobile.
            </p>
          </section>

          <header className="space-y-6 rounded-3xl border border-white bg-black p-5">
            <span className="inline-flex items-center gap-2 rounded-full border border-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white">
              On-chain proof of publish
            </span>
            <div className="space-y-3">
              <h1 className="text-3xl font-bold leading-tight text-white">
                Make content verifiable, forever.
              </h1>
              <p className="text-sm leading-6 text-gray-300">
                Canonicalize, hash, and register text or media with parent-aware versions, then verify it later without exposing content before you decide to sign.
              </p>
            </div>
            <div className="grid gap-3">
              {primaryCtas.map((cta) => (
                <Link
                  key={cta.href}
                  href={cta.href}
                  className={`inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-bold transition ${cta.tone}`}
                >
                  {cta.label}
                </Link>
              ))}
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-gray-400">
              {quickLinks.map((link) => (
                <Link key={link.href} href={link.href} className="underline hover:text-white">
                  {link.label}
                </Link>
              ))}
            </div>
          </header>

          <section className="rounded-3xl border border-white bg-black p-5">
            <div className="mb-4 flex items-center justify-between text-xs">
              <span className="font-semibold text-white">Canonicalization</span>
              <span className="rounded-full border border-white px-3 py-1 font-bold text-white">Deterministic</span>
            </div>
            <div className="space-y-3 text-sm">
              <div className="rounded-2xl border border-gray-700 p-4">
                <p className="font-bold text-white">Rules we enforce</p>
                <ul className="mt-2 space-y-1 text-xs text-gray-300">
                  <li>• Normalize whitespace, line endings, and Unicode</li>
                  <li>• Trim leading and trailing blank lines</li>
                  <li>• Ignore non-content metadata fields</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-gray-700 p-4">
                <p className="font-bold text-white">Hash preview</p>
                <code className="mt-2 block truncate rounded border border-gray-700 px-2 py-2 text-xs text-white">0x5f2c…9ab4</code>
                <p className="mt-2 text-xs text-gray-400">Hashes are computed locally in the browser before any lookup.</p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            {featureCards.map((card) => (
              <div key={card.title} className="rounded-3xl border border-white bg-black p-5">
                <h2 className="text-lg font-bold text-white">{card.title}</h2>
                <p className="mt-2 text-sm leading-6 text-gray-300">{card.body}</p>
                <Link href={card.href} className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-white hover:underline">
                  {card.cta} →
                </Link>
              </div>
            ))}
          </section>

          <section className="space-y-4 rounded-3xl border border-white bg-black p-5">
            <h2 className="text-lg font-bold text-white">Why canonicalization first?</h2>
            <p className="text-sm leading-6 text-gray-300">
              Matching proofs only works when everyone transforms content the same way. Keeping frontend, backend, and on-chain references aligned prevents hash drift over time.
            </p>
            <div className="grid gap-3">
              <div className="rounded-2xl border border-gray-700 p-4 text-sm text-gray-300">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-white">Privacy</p>
                <p className="mt-2">Hashes compute locally; content stays client-side unless you sign.</p>
              </div>
              <div className="rounded-2xl border border-gray-700 p-4 text-sm text-gray-300">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-white">Lineage</p>
                <p className="mt-2">Parent hashes link versions so provenance stays auditable.</p>
              </div>
              <div className="rounded-2xl border border-gray-700 p-4 text-sm text-gray-300">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-white">Integrity</p>
                <p className="mt-2">Deterministic rules keep publisher and verifier outputs aligned.</p>
              </div>
            </div>
            <Link
              href="/docs/canonicalization"
              className="inline-flex items-center justify-center rounded-full border border-white px-4 py-3 text-sm font-bold text-white hover:bg-white hover:text-black"
            >
              View canonicalization rules
            </Link>
          </section>

          <section className="rounded-3xl border border-white bg-black p-5 text-center">
            <h2 className="text-lg font-bold text-white">Test it yourself</h2>
            <p className="mt-2 text-sm leading-6 text-gray-300">
              Use the developer tools to preview canonicalization and hash computation in real time.
            </p>
            <Link
              href="/dev-tools"
              className="mt-4 inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-bold text-black hover:bg-gray-200"
            >
              Open Developer Tools →
            </Link>
          </section>
        </div>
      </main>
    );
  }

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
