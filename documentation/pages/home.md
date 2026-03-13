# Home Page Features

- Route: `/`
- Source: `app/page.tsx`

## What This Page Does

- Presents the app purpose: on-chain proof of publish.
- Provides primary navigation CTAs to Publish, Verify, and Dashboard.
- Links to canonicalization docs and dev tools.
- Explains canonicalization, privacy, lineage, and integrity in short sections.

## Notable Behaviors

- Responsive layouts with separate mobile and desktop structures.
- Mobile warning message indicates wallet-related limitations in mobile browsers.

## Environment Context

- Home page messaging assumes local development supports wallet + contract flows.
- For local testing, backend persistence is PostgreSQL and chain interactions target local Hardhat deployment.
