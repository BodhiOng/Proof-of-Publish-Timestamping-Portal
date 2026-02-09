// Seed script to populate database with sample publications
import fs from 'fs';
import path from 'path';

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

const SAMPLE_PUBLICATIONS: Publication[] = [
  {
    id: '1',
    title: 'Introduction to Proof of Publish',
    contentType: 'article',
    canonicalizedContent: `Proof of Publish: A Comprehensive Guide

Proof of publish is a cryptographic method for timestamping content on a blockchain.
By hashing content and registering it on-chain, we create an immutable record of when
and by whom a piece of content was published.

This approach has several key advantages:
- Immutable timestamping
- Decentralized verification
- Privacy-preserving (only hash is stored)
- Version tracking through parent hashes`,
    sourceUrl: 'https://example.com/proof-of-publish-intro',
    publisherWallet: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
    contentHash: '0xabcd1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
    txHash: '0x1111222233334444555566667777888899990000aaaabbbbccccddddeeeeffff',
    blockTimestamp: new Date(Date.now() - 7 * 86400000).toISOString(), // 7 days ago
    status: 'CONFIRMED',
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    id: '2',
    title: 'Introduction to Proof of Publish (Updated)',
    contentType: 'article',
    canonicalizedContent: `Proof of Publish: A Comprehensive Guide (v2)

Proof of publish is a cryptographic method for timestamping content on a blockchain.
By hashing content and registering it on-chain, we create an immutable record of when
and by whom a piece of content was published.

This approach has several key advantages:
- Immutable timestamping
- Decentralized verification
- Privacy-preserving (only hash is stored)
- Version tracking through parent hashes
- Cryptographic proof of authenticity

Updated to include additional benefits and use cases.`,
    sourceUrl: 'https://example.com/proof-of-publish-intro',
    publisherWallet: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
    contentHash: '0xdef4567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    parentHash: '0xabcd1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
    txHash: '0x2222333344445555666677778888999900001111aaaabbbbccccddddeeeeffff',
    blockTimestamp: new Date(Date.now() - 2 * 86400000).toISOString(), // 2 days ago
    status: 'CONFIRMED',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: '3',
    title: 'Smart Contract Code Example',
    contentType: 'code',
    canonicalizedContent: `pragma solidity ^0.8.0;

contract ProofOfPublish {
    mapping(bytes32 => Publication) public publications;
    
    struct Publication {
        address publisher;
        uint256 timestamp;
        bytes32 parentHash;
    }
    
    function publish(bytes32 contentHash, bytes32 parentHash) external {
        require(publications[contentHash].timestamp == 0, "Already published");
        
        publications[contentHash] = Publication({
            publisher: msg.sender,
            timestamp: block.timestamp,
            parentHash: parentHash
        });
    }
}`,
    publisherWallet: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
    contentHash: '0x3333444455556666777788889999aaaabbbbccccddddeeeeffffaaaa11112222',
    txHash: '0x3333444455556666777788889999aaaabbbbccccddddeeeeffffaaaa11112222',
    blockTimestamp: new Date(Date.now() - 5 * 86400000).toISOString(), // 5 days ago
    status: 'CONFIRMED',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: '4',
    title: 'Research Paper Draft',
    contentType: 'document',
    canonicalizedContent: `Decentralized Content Verification: A Novel Approach

Abstract:
This paper presents a novel approach to content verification using blockchain technology
and cryptographic hashing. We demonstrate how content can be timestamped and verified
without revealing the content itself.

Introduction:
Content authenticity and timestamping have become critical issues in the digital age.
Traditional methods rely on centralized authorities, which introduce single points of
failure and trust requirements.

Methodology:
Our approach uses SHA-256 hashing combined with Ethereum smart contracts to create
immutable records of content publication. The system preserves privacy by storing only
hashes on-chain while maintaining verifiability.

Results:
In our experiments, we achieved 100% verification accuracy with average gas costs of
21,000 gwei per publication.`,
    sourceUrl: 'https://example.com/research-paper',
    publisherWallet: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
    contentHash: '0x4444555566667777888899990000aaaabbbbccccddddeeeeffff1111222233',
    txHash: '0x4444555566667777888899990000aaaabbbbccccddddeeeeffff111122223344',
    blockTimestamp: new Date(Date.now() - 3 * 86400000).toISOString(), // 3 days ago
    status: 'CONFIRMED',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: '5',
    title: 'Quick Note',
    contentType: 'text',
    canonicalizedContent: `Remember to update the documentation with the new canonicalization rules.

Key points:
- Line ending normalization
- Trailing whitespace removal
- Unicode NFC normalization
- Trim blank lines`,
    publisherWallet: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
    contentHash: '0x5555666677778888999900001111222233334444555566667777888899990000',
    txHash: '0x5555666677778888999900001111222233334444555566667777888899991111',
    blockTimestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    status: 'CONFIRMED',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '6',
    title: 'Pending Publication',
    contentType: 'article',
    canonicalizedContent: `This is a test publication that is still pending confirmation on the blockchain.

The transaction has been submitted but not yet confirmed.`,
    publisherWallet: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
    contentHash: '0x6666777788889999aaaabbbbccccddddeeeeffff00001111222233334444555',
    txHash: '0x6666777788889999aaaabbbbccccddddeeeeffff00001111222233334444666',
    blockTimestamp: new Date().toISOString(),
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  },
];

function seedDatabase() {
  const dataDir = path.join(process.cwd(), 'data');
  const dbPath = path.join(dataDir, 'publications.json');

  // Create data directory if it doesn't exist
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log('✓ Created data directory');
  }

  // Write publications to database
  const data = { publications: SAMPLE_PUBLICATIONS };
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));

  console.log('✓ Database seeded successfully!');
  console.log(`✓ Added ${SAMPLE_PUBLICATIONS.length} sample publications`);
  console.log(`✓ Database location: ${dbPath}`);
  console.log('\nSample publications:');
  SAMPLE_PUBLICATIONS.forEach((pub) => {
    console.log(`  - ${pub.title} (ID: ${pub.id}, Status: ${pub.status})`);
  });
}

// Run the seed script
seedDatabase();
