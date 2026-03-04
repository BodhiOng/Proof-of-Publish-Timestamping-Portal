// Simple JSON-based database for publications
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'publications.json');

export type Publication = {
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

export type SyncSummary = {
  updated: number;
  confirmed: number;
  failed: number;
};

// Ensure data directory exists
function ensureDataDir() {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Initialize database if it doesn't exist
function initializeDb() {
  ensureDataDir();
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ publications: [] }, null, 2));
  }
}

// Read all publications
export function getPublications(): Publication[] {
  initializeDb();
  const data = fs.readFileSync(DB_PATH, 'utf-8');
  return JSON.parse(data).publications;
}

// Get publication by ID
export function getPublicationById(id: string): Publication | null {
  const publications = getPublications();
  return publications.find(p => p.id === id) || null;
}

export function getPublicationByTxHash(txHash: string): Publication | null {
  const publications = getPublications();
  return publications.find(p => p.txHash.toLowerCase() === txHash.toLowerCase()) || null;
}

// Get publications by wallet address
export function getPublicationsByWallet(wallet: string): Publication[] {
  const publications = getPublications();
  return publications.filter(p => p.publisherWallet.toLowerCase() === wallet.toLowerCase());
}

// Find publications by content hash
export function getPublicationsByHash(hash: string): Publication[] {
  const publications = getPublications();
  return publications.filter(p => p.contentHash.toLowerCase() === hash.toLowerCase());
}

// Add new publication
export function addPublication(publication: Publication): void {
  initializeDb();
  const publications = getPublications();
  publications.push(publication);
  fs.writeFileSync(DB_PATH, JSON.stringify({ publications }, null, 2));
}

// Update publication status
export function updatePublicationStatus(id: string, status: Publication['status'], txHash?: string): boolean {
  initializeDb();
  const publications = getPublications();
  const index = publications.findIndex(p => p.id === id);
  
  if (index === -1) return false;
  
  publications[index].status = status;
  publications[index].blockTimestamp = new Date().toISOString();
  if (txHash) {
    publications[index].txHash = txHash;
  }
  
  fs.writeFileSync(DB_PATH, JSON.stringify({ publications }, null, 2));
  return true;
}

export function synchronizePendingPublications(confirmAfterMs = 45000): SyncSummary {
  initializeDb();
  const publications = getPublications();
  const now = Date.now();

  let updated = 0;
  let confirmed = 0;
  let failed = 0;

  const next = publications.map(publication => {
    if (publication.status !== 'PENDING') {
      return publication;
    }

    const ageMs = now - new Date(publication.createdAt).getTime();
    if (ageMs < confirmAfterMs) {
      return publication;
    }

    const lastNibble = publication.txHash.at(-1)?.toLowerCase() ?? '0';
    const shouldFail = ['a', 'b', 'c', 'd', 'e', 'f'].includes(lastNibble);
    const nextStatus: Publication['status'] = shouldFail ? 'FAILED' : 'CONFIRMED';

    updated += 1;
    if (nextStatus === 'CONFIRMED') confirmed += 1;
    if (nextStatus === 'FAILED') failed += 1;

    return {
      ...publication,
      status: nextStatus,
      blockTimestamp: new Date().toISOString(),
    };
  });

  if (updated > 0) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ publications: next }, null, 2));
  }

  return { updated, confirmed, failed };
}

// Get version chain (find children and parents)
export function getVersionChain(contentHash: string): { parent: Publication | null; children: Publication[] } {
  const publications = getPublications();
  const parent = publications.find(p => p.contentHash === contentHash);
  
  if (!parent) {
    return { parent: null, children: [] };
  }
  
  const children = publications.filter(p => p.parentHash === parent.contentHash);
  
  return { parent, children };
}

// Get next version (child)
export function getNextVersion(contentHash: string): Publication | null {
  const publications = getPublications();
  return publications.find(p => p.parentHash === contentHash) || null;
}

// Get previous version (parent)
export function getPreviousVersion(parentHash: string): Publication | null {
  const publications = getPublications();
  return publications.find(p => p.contentHash === parentHash) || null;
}
