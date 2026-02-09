## Pages Requiring Backend

**Publish Page**
- Canonicalization endpoint (for cross-verification)
- Transaction submission/relay endpoint
- Metadata persistence (title, content type, source URL, parent hash, publisher address, tx hash, timestamp)
- Publication ID generation and tracking
- Transaction status monitoring (pending/confirmed/failed)

**Verify Page**
- On-chain hash lookup endpoint
- Query registry contract or indexed database for matches
- Return publication metadata for matched hashes
- Optional: URL content fetching service (if supporting URL verification)

**Dashboard Page**
- List publications by wallet address
- Filter and search API
- Transaction status synchronization with blockchain
- Pagination support
- Real-time or polling updates for pending transactions

**Publication Detail Page**
- Fetch single publication by ID
- Return full metadata and canonicalized content (if stored)
- Version chain navigation (parent/child hash resolution)
- Transaction details lookup

**Connect Wallet Page**
- Backend signing service (if offering this option)
- Secure key management (HSM/vault)
- Transaction signing/relay endpoint
- Access control and audit logging

**No Backend Required**
- Home page (static)
- FAQ page (static)
- Docs/Canonicalization page (static)
- Dev Tools page (client-side only)