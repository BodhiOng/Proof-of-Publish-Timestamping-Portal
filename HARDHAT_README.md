# Blockchain Assignment Part 2

This project combines a Next.js frontend with Hardhat for Ethereum smart contract development.

## Setup

### Prerequisites
- Node.js v22.10.0 or later (LTS version with even major number)
- npm or yarn

### Installation

```bash
npm install
```

## Hardhat & Solidity

This project includes Hardhat for smart contract development with the following structure:

- `contracts/` - Solidity smart contracts
- `scripts/` - Deployment scripts
- `test/` - Contract tests
- `ignition/modules/` - Hardhat Ignition deployment modules

### Available Hardhat Commands

```bash
# Compile contracts
npm run hardhat:compile

# Run tests
npm run hardhat:test

# Start a local Hardhat node
npm run hardhat:node

# Deploy to local network (run hardhat:node first in another terminal)
npm run hardhat:deploy:local

# Deploy with custom network
npm run hardhat:deploy -- --network <network-name>
```

### Example Contract

The project includes a sample `Lock.sol` contract that demonstrates:
- Time-locked fund withdrawal
- Basic access control
- Event emission
- Solidity 0.8.28 features

### Configuration

Configure your deployment networks in `hardhat.config.js`. For testnets and mainnet:

1. Copy `.env.example` to `.env`
2. Add your RPC URLs and private keys
3. Add your Etherscan API key for contract verification

```bash
cp .env.example .env
```

**⚠️ Never commit your `.env` file or private keys!**

### Testing Smart Contracts

Run the test suite:

```bash
npm run hardhat:test
```

For gas reporting, set `REPORT_GAS=true` in your `.env` file.

### Deploying Contracts

#### Local Development

1. Start a local Hardhat node:
```bash
npm run hardhat:node
```

2. In another terminal, deploy:
```bash
npm run hardhat:deploy:local
```

#### Testnet Deployment

1. Configure your testnet in `hardhat.config.js`
2. Add RPC URL and private key to `.env`
3. Deploy:
```bash
npx hardhat run scripts/deploy.ts --network sepolia
```

### Using Hardhat Ignition

Hardhat Ignition provides a declarative deployment system:

```bash
npx hardhat ignition deploy ./ignition/modules/Lock.ts
```

## Next.js Application

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
npm start
```

## Project Structure

```
├── app/                    # Next.js app directory
├── contracts/              # Solidity smart contracts
├── scripts/                # Hardhat deployment scripts
├── test/                   # Contract tests
├── ignition/modules/       # Hardhat Ignition modules
├── hardhat.config.js       # Hardhat configuration
└── package.json            # Project dependencies
```

## Learn More

- [Hardhat Documentation](https://hardhat.org/docs)
- [Solidity Documentation](https://docs.soliditylang.org/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Ethers.js Documentation](https://docs.ethers.org/)

## Troubleshooting

### Node.js Version Warning

If you see a warning about Node.js version, upgrade to Node.js 22.10.0 or later:

```bash
# Using nvm
nvm install 22
nvm use 22
```

### Compilation Issues

If contracts fail to compile, try clearing the cache:

```bash
npx hardhat clean
npm run hardhat:compile
```
