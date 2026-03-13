# Dashboard Page Features

- Route: `/dashboard`
- Source: `app/dashboard/page.tsx`

## What This Page Does

- Displays publication records with filtering, sorting, and pagination.
- Supports view modes such as all publications vs wallet-owned publications.
- Supports publication management actions (including delete flows).

## Notable Behaviors

- Server-side pagination with page cache and next-page prefetch.
- Search and content-type filters.
- Periodic sync refresh for updated publication states.
- Bulk selection helpers and select mode management.
- Proof export/download and clipboard helper utilities.
