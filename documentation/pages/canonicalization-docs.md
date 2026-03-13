# Canonicalization Docs Page Features

- Route: `/docs/canonicalization`
- Source: `app/docs/canonicalization/page.tsx`

## What This Page Does

- Documents canonicalization rules used for deterministic hashing.
- Explains why canonicalization is required for reproducible verification.
- Shows rule-by-rule examples and a reference implementation.

## Notable Behaviors

- Covers trimming, LF normalization, trailing whitespace removal, NFC normalization, and metadata exclusion.
- Includes complete before/after examples and sample hash output.
- Links to dev tools for practical testing.
- Includes responsive mobile and desktop layouts.

## Rule Source

- Canonicalization behavior reflects the shared utility used by publish and verify APIs.
