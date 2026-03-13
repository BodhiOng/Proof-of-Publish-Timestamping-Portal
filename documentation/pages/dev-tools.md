# Dev Tools Page Features

- Route: `/dev-tools`
- Source: `app/dev-tools/page.tsx`

## What This Page Does

- Provides a sandbox to test canonicalization and hashing logic.
- Lets users paste content, canonicalize it, and compute SHA-256 hash.
- Helps developers validate parity with publish and verify pipelines.

## Notable Behaviors

- Includes sample input loader, reset, and copy-to-clipboard helpers.
- Displays input statistics (characters, lines, bytes, words).
- Provides quick links to canonicalization docs, verify, and publish.

## Recommended Use

- Use before publishing to confirm canonicalized output and final hash.
- Use when troubleshooting hash mismatch during verify flows.