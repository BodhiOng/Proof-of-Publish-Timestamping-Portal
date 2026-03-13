# Publish Page Features

- Route: `/publish`
- Source: `app/publish/page.tsx`

## What This Page Does

- Creates new publication records.
- Supports content types: text, article, code, document, image, audio, video.
- Canonicalizes content and computes SHA-256 hashes before publishing.
- Integrates with wallet connection/signing flow.

## Notable Behaviors

- File upload support with content-type-based restrictions and size limits.
- Optional article scraping from source URL.
- Parent-hash suggestions to create version lineage links.
- Duplicate checking and confirm/publish flow.
- Tracks publish result details like tx hash, status, and timestamp.
