# Publish Page Features

- Route: `/publish`
- Source: `app/publish/page.tsx`

## What This Page Does

- Creates new publication records.
- Supports content types: text, article, code, document, image, audio, video.
- Canonicalizes content and computes SHA-256 hashes before publishing.
- Submits on-chain `registerPublication` transaction to `PublicationRegistry`.
- Persists publication metadata through backend API after chain confirmation.

## Notable Behaviors

- File upload support with content-type-based restrictions and size limits.
- Optional article scraping from source URL.
- Parent-hash suggestions to create version lineage links.
- Duplicate checking and confirm/publish flow.
- Tracks publish result details like tx hash, status, and timestamp.

## Publish Sequence

1. Validate content + optional parent hash.
2. Canonicalize and hash content.
3. Open confirm modal.
4. On confirm, submit contract transaction from connected wallet.
5. Wait for receipt, then store publication record in backend.

## Local Development Notes

- Use Localhost 8545 in MetaMask when testing local contract deployment.
- Ensure `NEXT_PUBLIC_PUBLICATION_REGISTRY_ADDRESS` points to your latest local deployment.
