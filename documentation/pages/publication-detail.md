# Publication Detail Page Features

- Route: `/publication/[id]`
- Source: `app/publication/[id]/page.tsx`

## What This Page Does

- Displays full details for a single publication by ID.
- Shows content metadata, hash values, chain info, and lineage links.
- Handles unavailable/not-found states gracefully.

## Notable Behaviors

- Polls for publication updates while the page is visible.
- Detects and announces newly linked child versions.
- Loads publisher profile data for display.
- Supports copy helpers and content/proof downloads.
- Includes publication deletion flow for authorized owners.
