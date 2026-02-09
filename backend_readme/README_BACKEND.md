# Backend Setup - Publication Detail Page

## Overview
This backend implementation provides API endpoints for managing and retrieving publication data. It uses a simple JSON-based database for ease of development and can be easily migrated to PostgreSQL, MongoDB, or any other database later.

## Files Created

### Database Layer (`lib/db.ts`)
- Simple JSON file-based database
- CRUD operations for publications
- Version chain navigation helpers
- Wallet-based queries

### API Endpoints

#### `GET /api/publications/:id`
Fetch a single publication by ID with version chain information.

**Response:**
```json
{
  "id": "1",
  "title": "Example Publication",
  "contentType": "article",
  "canonicalizedContent": "...",
  "contentHash": "0xabc...",
  "publisherWallet": "0x742...",
  "txHash": "0x123...",
  "blockTimestamp": "2026-02-01T12:00:00Z",
  "status": "CONFIRMED",
  "parentHash": "0xdef...",
  "prevVersion": "0",
  "nextVersion": "2"
}
```

#### `GET /api/publications`
List all publications with optional filters.

**Query Parameters:**
- `wallet` - Filter by wallet address
- `status` - Filter by status (PENDING/CONFIRMED/FAILED)
- `search` - Search by title, hash, or ID

**Response:**
```json
{
  "publications": [...]
}
```

#### `POST /api/publications/verify`
Verify if a content hash exists in the database.

**Request Body:**
```json
{
  "contentHash": "0xabc..."
}
```

**Response:**
```json
{
  "hash": "0xabc...",
  "matched": true,
  "matches": [
    {
      "publicationId": "1",
      "publisher": "0x742...",
      "timestamp": "2026-02-01T12:00:00Z",
      "txHash": "0x123...",
      "title": "Example",
      "status": "CONFIRMED"
    }
  ]
}
```

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Seed the Database
```bash
npm run seed
```

This will:
- Create `data/publications.json`
- Populate it with 6 sample publications
- Include version chains and different statuses

### 3. Start Development Server
```bash
npm run dev
```

### 4. Test the API

**Get single publication:**
```bash
curl http://localhost:3000/api/publications/1
```

**List all publications:**
```bash
curl http://localhost:3000/api/publications
```

**Filter by wallet:**
```bash
curl "http://localhost:3000/api/publications?wallet=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1"
```

**Verify content hash:**
```bash
curl -X POST http://localhost:3000/api/publications/verify \
  -H "Content-Type: application/json" \
  -d '{"contentHash":"0xabcd1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab"}'
```

## Database Schema

```typescript
type Publication = {
  id: string;
  title: string;
  contentType: string;
  canonicalizedContent: string;
  sourceUrl?: string;
  publisherWallet: string;
  contentHash: string;
  parentHash?: string;
  txHash: string;
  blockTimestamp: string;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED';
  createdAt: string;
};
```

## Sample Publications

The seed script creates:
1. **Introduction to Proof of Publish** - Original article
2. **Introduction to Proof of Publish (Updated)** - Version 2 with parentHash
3. **Smart Contract Code Example** - Code snippet
4. **Research Paper Draft** - Document
5. **Quick Note** - Simple text
6. **Pending Publication** - Shows pending status

## Frontend Integration

Update the publication detail page to fetch from the API:

```typescript
// In app/publication/[id]/page.tsx
const { id } = use(params);

// Fetch from API instead of using mock data
const response = await fetch(`http://localhost:3000/api/publications/${id}`);
const publication = await response.json();
```

## Migration to Real Database

When ready to migrate to a real database:

1. **PostgreSQL:**
   - Use Prisma or Drizzle ORM
   - Replace `lib/db.ts` functions with database queries
   - Keep the same function signatures

2. **MongoDB:**
   - Use Mongoose
   - Replace file operations with MongoDB operations
   - Schema remains the same

3. **Supabase:**
   - Use Supabase client
   - Create table matching the schema
   - Replace functions with Supabase queries

## Independent Development

Your friend can now:
- ✓ Develop frontend using real API endpoints
- ✓ Test with realistic data
- ✓ Work without waiting for Publish page backend
- ✓ Use the same database schema when Publish is implemented

## Next Steps

1. Update frontend pages to use API endpoints
2. Add error handling and loading states
3. Implement pagination for large datasets
4. Add authentication/authorization if needed
5. Migrate to production database when ready
