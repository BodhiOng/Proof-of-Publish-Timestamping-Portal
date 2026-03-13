# Client-Side User Manual

This manual explains how to use the application from the frontend perspective only. It is written for end users, testers, and demo presenters.

## 1. What the System Does

The app lets you:

- Create verifiable publication records.
- Canonicalize content to keep hash generation deterministic.
- Hash content (SHA-256) and verify it later.
- Publish parent-child content versions for provenance.
- Track publication status, transaction IDs, and timestamps.
- Create and manage wallet-bound user profiles.

Main client routes:

- Home: `/`
- Connect Wallet: `/connect-wallet`
- Publish: `/publish`
- Verify: `/verify`
- Dashboard: `/dashboard`
- Publication Detail: `/publication/[id]`
- Canonicalization Docs: `/docs/canonicalization`
- Developer Tools: `/dev-tools`

## 2. Before You Start

Recommended client-side setup:

- Use a desktop browser with MetaMask installed.
- Connect MetaMask to your local Hardhat network for local development.
- Keep pop-up windows enabled for wallet signature/transaction prompts.

Mobile note:

- The app supports mobile UI layouts, but wallet-extension based actions are limited on standard mobile browsers.

## 3. Home Page Walkthrough

On `/`, use the primary buttons:

- `Publish`: create a new proof-of-publish record.
- `Verify`: check if content matches existing records.
- `Dashboard`: browse existing records and manage your own.

Use quick links for:

- Canonicalization documentation.
- Developer tools for canonicalization/hash testing.

## 4. Connect Wallet and Account Profile

Go to `/connect-wallet`.

### 4.1 Connect Wallet

1. Click connect.
2. Approve in MetaMask.
3. Confirm address, chain ID, network label, and displayed balance.

If account changes in MetaMask, the page updates automatically.

### 4.2 Network Handling

- For local development, use Localhost 8545 (Chain ID 1337).
- If a transaction popup shows Ethereum Mainnet, cancel and switch back to Localhost before retrying.

### 4.3 Profile Management

After connection, fill or update profile fields:

- Username
- Display name
- Bio
- Avatar URL or uploaded avatar image
- Website
- Location

Then save profile. The client performs challenge/signature-based profile operations through backend APIs.

Expected wallet interaction for profile save:

- Signature request (message signing), not a value transfer.

## 5. Publishing Content

Go to `/publish`.

### 5.1 Choose Content Type

Available types:

- `text`
- `article`
- `code`
- `document`
- `image`
- `audio`
- `video`

### 5.2 Provide Content

Depending on type, use one of these flows:

- Direct text input.
- File upload (for code/document/media types).
- URL source flow for article scraping.

For file-based flows, the UI may lock manual content editing and build a descriptor payload automatically.

### 5.3 Add Version Lineage (Optional)

Use `parent hash` to link the new publication to a previous one.

- Suggested hashes are shown from your known publications.
- Type compatibility checks can apply.

### 5.4 Canonicalization and Hashing

Before final publish:

- Content is canonicalized.
- SHA-256 hash is computed.
- The app may check for duplicate hash entries.

### 5.5 Sign and Publish

1. Confirm publish details in the UI.
2. Approve the contract transaction in MetaMask.
3. The app submits `registerPublication` to the deployed `PublicationRegistry` contract.
4. Wait for transaction confirmation and persisted record update.

On success, capture these values:

- Publication ID
- Content hash
- Transaction hash
- Block timestamp

Expected wallet interaction for publish:

- Transaction approval with gas fee on your currently selected network.

## 6. Verifying Content

Go to `/verify`.

### 6.1 Select Input Method

Three modes:

- `Text`: paste text directly.
- `File`: upload a file and let the app compute descriptor + hash.
- `URL`: ask backend to fetch source content for verification.

### 6.2 Run Verification

1. Click the verify/compute action.
2. The page computes hash and checks for matches.

Expected result states:

- Match found with publication references.
- No match found.
- Error state (network, malformed input, or fetch issues).

### 6.3 Privacy Behavior

- Hashing is designed to happen in-browser first.
- Content is only sent when a flow explicitly requires backend processing (for example URL fetch or API verification operations).

## 7. Dashboard Usage

Go to `/dashboard`.

### 7.1 Browse and Filter

Use:

- Search term
- Content-type filter
- Sort mode
- View mode (`all` or `mine`)

### 7.2 Pagination

- Move between pages.
- Change page size where available.
- Expect faster transitions due to page cache and next-page prefetch.

### 7.3 Manage Your Publications

When connected and in your own view:

- Enter select mode.
- Select one or many publications.
- Delete selected publications (with confirmation).

### 7.4 Proof and Utility Actions

- Copy hashes/IDs/transaction values.
- Download proof JSON where offered.
- Use scroll-to-top helper when working with long lists.

## 8. Publication Detail Page

Open `/publication/[id]` from dashboard links.

This page provides:

- Full publication metadata.
- Canonicalized content preview.
- Content hash, tx hash, timestamps.
- Parent/child lineage links.

Additional behavior:

- Background polling for updates while page is visible.
- Temporary alert if a new child version is linked.
- Publisher profile enrichment when available.

Possible actions:

- Copy values to clipboard.
- Download canonicalized content/proof outputs (if offered by the UI state).
- Delete publication if you are an authorized owner.

## 9. Canonicalization Rules (User View)

Canonicalization ensures equivalent content produces the same hash.

Rule summary:

1. Trim outer boundary whitespace.
2. Normalize line endings to LF (`\n`).
3. Remove trailing whitespace on each line.
4. Normalize Unicode to NFC.
5. Hash canonicalized content only (metadata excluded).

Read `/docs/canonicalization` for examples.

## 10. Developer Tools Page

Go to `/dev-tools` for test workflows.

What you can do:

- Paste raw content.
- Run canonicalization and hash computation.
- Compare raw vs canonicalized output.
- Copy canonicalized content or hash.
- Load sample input for demo/testing.

Use this page to verify that expected content transformations are happening before you publish or verify.

## 11. Typical End-to-End User Flows

### Flow A: First-Time Publisher

1. Open `/connect-wallet` and connect MetaMask.
2. Set up profile.
3. Open `/publish`.
4. Select content type and provide content.
5. (Optional) select parent hash.
6. Confirm canonicalization/hash preview.
7. Sign/publish.
8. Verify record in `/dashboard`.

### Flow B: Verify Existing Content

1. Open `/verify`.
2. Choose text/file/URL method.
3. Run verification.
4. Open matching publication detail to inspect lineage and transaction proof.

### Flow C: Manage Existing Records

1. Open `/dashboard`.
2. Switch to `mine`.
3. Filter/sort/search records.
4. Open detail view or delete selected items.

## 12. Error Handling and Troubleshooting

### Wallet Not Detected

- Install MetaMask.
- Refresh page and retry.

### Wrong Network

- Switch chain in MetaMask to Localhost 8545 for local development.
- Cancel any popup that attempts Mainnet transfer/interaction during local testing.

### Signature/Transaction Rejected

- Re-run publish/profile action and approve in wallet.

### Verification Mismatch

- Ensure input is exactly the same source content.
- Check canonicalization assumptions (line endings, trailing spaces, Unicode).
- Use `/dev-tools` to compare transformed outputs.

### Slow or Missing Updates

- Refresh `/dashboard` or publication detail page.
- Confirm backend and chain node availability.

### Failed to load account or Failed to create account

- Check `DATABASE_URL` in `.env.local`.
- Confirm PostgreSQL is running and credentials are correct.
- Restart the dev server after environment changes.