# Verify Page Features

- Route: `/verify`
- Source: `app/verify/page.tsx`

## What This Page Does

- Verifies whether provided content matches an existing publication proof.
- Supports three input modes: text, file upload, and URL fetch.
- Computes file descriptors and SHA-256 hashes for parity with publish flow.

## Notable Behaviors

- Uses browser crypto first (`SubtleCrypto`), with fallback hashing support.
- Shows verification matches including publication metadata where available.
- Includes copy helpers for hashes and values.
- Includes mobile-optimized layout.
