# Connect Wallet Backend Setup

## Overview
The Connect Wallet page is mostly **frontend-only** using MetaMask/WalletConnect. Backend is **optional** and only needed for the "backend signing" feature (not recommended for production).

## Dependencies

### This page depends on: **NOTHING**
- Completely independent
- No other page backends needed
- Works standalone

### What depends on this:
- **Publish Page** can use backend signing (optional)
- **Dashboard** needs wallet connection (client-side only)
- All wallet operations happen client-side via MetaMask/WalletConnect

## Backend Components (Optional)

### When to use backend signing:
- ✓ Testing/development
- ✓ Demo purposes
- ✓ Educational projects
- ✗ **NEVER in production with real funds**

### Files Created

**Backend Signer Service** (`lib/backend-signer.ts`)
- Signs transactions server-side
- Audit logging
- Rate limiting
- Security warnings

**API Endpoints:**

#### `POST /api/wallet/backend-sign`
Sign a content hash with backend wallet.

**Request:**
```json
{
  "contentHash": "0xabc..."
}
```

**Response:**
```json
{
  "signature": "0x...",
  "signerAddress": "0x...",
  "contentHash": "0x...",
  "timestamp": "2026-02-09T...",
  "warning": "Backend signing is less secure..."
}
```

**Rate Limits:**
- 10 requests per minute per IP
- Returns 429 if exceeded

#### `GET /api/wallet/backend-sign`
Get backend wallet address (if enabled).

**Response:**
```json
{
  "address": "0x...",
  "enabled": true,
  "warning": "For testing only..."
}
```

#### `GET /api/wallet/status`
Check available signing methods.

**Response:**
```json
{
  "backendSigning": {
    "enabled": false,
    "address": null
  },
  "clientSigning": {
    "metamask": true,
    "walletConnect": true
  },
  "recommendations": {
    "preferred": "metamask",
    "warning": "Always use your own wallet..."
  }
}
```

## Setup Instructions

### 1. Environment Variables

Copy `.env.local.example` to `.env.local`:
```bash
cp .env.local.example .env.local
```

**For development/testing only:**
```env
ENABLE_BACKEND_SIGNING=true
BACKEND_SIGNER_PRIVATE_KEY=0x1234...
```

**For production (recommended):**
```env
ENABLE_BACKEND_SIGNING=false
```

### 2. Generate Backend Wallet (Optional)

If you want to test backend signing:

```javascript
// In node REPL or script
const { Wallet } = require('ethers');
const wallet = Wallet.createRandom();

console.log('Private Key:', wallet.privateKey);
console.log('Address:', wallet.address);
console.log('Mnemonic:', wallet.mnemonic.phrase);
```

**⚠️ NEVER commit private keys to git!**

### 3. Test the Endpoints

**Check status:**
```bash
curl http://localhost:3000/api/wallet/status
```

**Get backend address (if enabled):**
```bash
curl http://localhost:3000/api/wallet/backend-sign
```

**Sign a hash:**
```bash
curl -X POST http://localhost:3000/api/wallet/backend-sign \
  -H "Content-Type: application/json" \
  -d '{"contentHash":"0xabcd1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab"}'
```

## Frontend Integration

### Using Backend Signing (not recommended)

```typescript
// In app/publish/page.tsx
const signWithBackend = async (contentHash: string) => {
  const response = await fetch('/api/wallet/backend-sign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contentHash }),
  });
  
  const { signature, signerAddress } = await response.json();
  return { signature, signerAddress };
};
```

### Using MetaMask (recommended)

```typescript
// In app/publish/page.tsx
const signWithMetaMask = async (contentHash: string) => {
  if (!window.ethereum) {
    throw new Error('MetaMask not installed');
  }
  
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const signature = await signer.signMessage(contentHash);
  
  return { signature, signerAddress: await signer.getAddress() };
};
```

## Security Considerations

### Backend Signing Risks:
- ❌ Server controls private key (single point of failure)
- ❌ Not true ownership (user doesn't control keys)
- ❌ Vulnerable to server compromise
- ❌ Centralized trust model
- ❌ No protection if server is hacked

### Client Signing (MetaMask) Benefits:
- ✓ User controls private key
- ✓ True ownership
- ✓ Decentralized
- ✓ Protected by hardware wallet (optional)
- ✓ No server trust required

### If Using Backend Signing:
1. **Rate limiting** - 10 requests/min per IP
2. **Audit logging** - All signatures logged
3. **IP tracking** - Monitor for abuse
4. **Environment flag** - Easy to disable
5. **Warning messages** - User sees security warnings

## Audit Logs

View backend signing activity:

```typescript
import { getSigningLogs } from '@/lib/backend-signer';

const logs = getSigningLogs();
console.log(logs);
```

Logs include:
- Timestamp
- Signer address
- Content hash
- Signature
- Client IP address

## Production Deployment

**Recommended settings for production:**

```env
# .env.production
ENABLE_BACKEND_SIGNING=false
```

**Remove backend signing entirely:**
1. Set `ENABLE_BACKEND_SIGNING=false`
2. All API calls will return 403 Forbidden
3. Frontend should only show MetaMask/WalletConnect options

## Testing

### Test Rate Limiting

Make 11 requests rapidly:
```bash
for i in {1..11}; do
  curl -X POST http://localhost:3000/api/wallet/backend-sign \
    -H "Content-Type: application/json" \
    -d '{"contentHash":"0xabcd1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab"}'
  echo ""
done
```

The 11th request should return 429 (Rate Limited).

### Test Invalid Hash

```bash
curl -X POST http://localhost:3000/api/wallet/backend-sign \
  -H "Content-Type: application/json" \
  -d '{"contentHash":"invalid"}'
```

Should return 400 (Bad Request).

## Summary

**Connect Wallet Page:**
- ✓ Independent (no dependencies)
- ✓ Mostly client-side
- ✓ Backend optional (for testing only)
- ✓ Can develop without other pages
- ✗ Don't use backend signing in production

**For your friend:**
They can build Connect Wallet page with just MetaMask/WalletConnect integration (no backend needed). The backend signing service is a separate optional feature that Publish page can consume if available.
