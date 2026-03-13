# Proof-of-Publish Timestamping Portal

Next.js + React frontend with:

- local PostgreSQL-backed API storage
- local Hardhat blockchain deployment
- frontend wallet flow that submits publication hashes to the Solidity contract

## Prerequisites

- Node.js 20+
- PostgreSQL running locally
- MetaMask connected to local Hardhat network

## 1. Install dependencies

```bash
npm install
```

## 2. Configure environment

Copy `.env.example` to `.env.local` and update values:

```bash
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/proof_publish
NEXT_PUBLIC_PUBLICATION_REGISTRY_ADDRESS=0xYourDeployedContractAddress
```

Notes:

- Tables are auto-created on first API access.
- `NEXT_PUBLIC_PUBLICATION_REGISTRY_ADDRESS` must be the deployed `PublicationRegistry` contract address.

## 3. Start local blockchain and deploy contract

Terminal A:

```bash
npm run hardhat:node
```

Terminal B:

```bash
npm run hardhat:deploy:local
```

Take the deployed contract address from Terminal B and set it in `.env.local`.

## 4. Run the app

```bash
npm run dev
```

Open `http://localhost:3000`.

## Objective Coverage

- Frontend in Next.js/React: implemented
- Frontend linked to local database: implemented via PostgreSQL-backed API
- Solidity deployed to local Hardhat node: implemented
- Frontend linked to Solidity contract: implemented in publish flow (wallet signs/sends `registerPublication` transaction)
