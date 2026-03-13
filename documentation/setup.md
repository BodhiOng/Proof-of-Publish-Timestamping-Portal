# System Setup Guide

This project uses Next.js + React for the frontend, PostgreSQL for local persistence, and a local Hardhat blockchain for smart contract interactions.

## 1. Prerequisites

- Node.js 20+
- npm
- PostgreSQL running locally
- MetaMask browser extension

## 2. Install Dependencies

From the project root:

```bash
npm install
```

## 3. Configure Environment

Create or update `.env.local` in the project root:

```dotenv
DATABASE_URL=postgresql://YOUR_DB_USER:YOUR_DB_PASSWORD@127.0.0.1:5432/proof_publish
NEXT_PUBLIC_PUBLICATION_REGISTRY_ADDRESS=0xYourDeployedContractAddress
```

Notes:

- `DATABASE_URL` must match your real local PostgreSQL credentials.
- `NEXT_PUBLIC_PUBLICATION_REGISTRY_ADDRESS` must be the deployed `PublicationRegistry` contract address.
- Never place private keys in `NEXT_PUBLIC_` variables.

## 4. Prepare Local Database

Ensure database `proof_publish` exists in PostgreSQL. Use pgAdmin to create it. Take note of all of the sensitive informations mentioned in Env's DATABASE_URL

The app auto-creates required tables on first API access.

## 5. Start Local Blockchain

Terminal A:

```bash
npm run hardhat:node
```

## 6. Deploy Contract to Local Node

Terminal B:

```bash
npm run hardhat:deploy:local
```

Copy the address from output:

`PublicationRegistry deployed to 0x...`

Put that value into `.env.local` as `NEXT_PUBLIC_PUBLICATION_REGISTRY_ADDRESS`.

## 7. Configure MetaMask for Local Use

Add Localhost RPC network:

- Network RPC URL: `http://127.0.0.1:8545`
- Chain ID: `1337`
- Currency symbol: `ETH`

Import one of the Hardhat test accounts from the node output (refer back to 5), take the private key from one of those accounts listed.

## 8. Run the App

```bash
npm run dev
```

Open `http://localhost:3000`.

## 9. Common Issues

### Failed to load account

- Usually caused by incorrect `DATABASE_URL` credentials.
- Verify DB access and restart dev server after env changes.

### MetaMask asks for Mainnet transaction
- Remove all of the other networks and only tick Localhost 8545 (🌐 > Manage permissions > Use your enabled networks > Edit networks)
- Switch MetaMask to Localhost 8545 before approving.
- Local development should not use Ethereum Mainnet.