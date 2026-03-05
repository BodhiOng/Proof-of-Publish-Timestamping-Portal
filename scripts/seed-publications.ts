import fs from 'fs';
import path from 'path';
import { computeContentHash, generateMockTxHash, generatePublicationId } from '../lib/publication-utils';

type PublicationStatus = 'PENDING' | 'CONFIRMED' | 'FAILED';

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
  status: PublicationStatus;
  createdAt: string;
};

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'publications.json');
const FALLBACK_WALLETS = [
  '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
  '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
];

function parseOptions() {
  const args = process.argv.slice(2);
  let target = 100;
  let wallet: string | undefined;
  let reset = false;

  for (let i = 0; i < args.length; i += 1) {
    const token = args[i];
    if ((token === '--target' || token === '-t') && args[i + 1]) {
      const parsed = Number.parseInt(args[i + 1], 10);
      if (!Number.isNaN(parsed) && parsed > 0) {
        target = parsed;
      }
      i += 1;
      continue;
    }

    if ((token === '--wallet' || token === '-w') && args[i + 1]) {
      wallet = args[i + 1];
      i += 1;
      continue;
    }

    if (token === '--reset') {
      reset = true;
    }
  }

  return { target, wallet, reset };
}

function ensureDb(): Publication[] {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ publications: [] }, null, 2));
  }

  const content = fs.readFileSync(DB_PATH, 'utf-8');
  const parsed = JSON.parse(content) as { publications?: Publication[] };
  return Array.isArray(parsed.publications) ? parsed.publications : [];
}

function ensureStorage() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function toIsoFromDaysAgo(daysAgo: number): string {
  return new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
}

function createPublication(index: number, wallet: string): Publication {
  const contentTypeOptions = ['text', 'article', 'code', 'document', 'image', 'audio', 'video'];
  const contentType = contentTypeOptions[index % contentTypeOptions.length];
  const statusOptions: PublicationStatus[] = ['CONFIRMED', 'PENDING', 'FAILED'];
  const status = statusOptions[index % statusOptions.length];

  const createdAt = toIsoFromDaysAgo(index % 40);
  const canonicalizedContent = [
    `Pagination Seed Publication #${index + 1}`,
    `TYPE:${contentType}`,
    `This entry exists to test dashboard pagination, sorting, and filtering behavior.`,
  ].join('\n');

  return {
    id: generatePublicationId(),
    title: `Seed Publication ${index + 1}`,
    contentType,
    canonicalizedContent,
    sourceUrl: contentType === 'article' ? `https://example.com/seed/${index + 1}` : undefined,
    publisherWallet: wallet,
    contentHash: computeContentHash(canonicalizedContent),
    txHash: generateMockTxHash(),
    blockTimestamp: createdAt,
    status,
    createdAt,
  };
}

function save(publications: Publication[]) {
  ensureStorage();
  fs.writeFileSync(DB_PATH, JSON.stringify({ publications }, null, 2));
}

function seedDatabase() {
  const { target, wallet, reset } = parseOptions();
  const existing = reset ? [] : ensureDb();

  const walletsFromDb = Array.from(new Set(existing.map((p) => p.publisherWallet).filter(Boolean)));
  const walletPool = wallet
    ? [wallet]
    : walletsFromDb.length > 0
      ? walletsFromDb
      : FALLBACK_WALLETS;

  if (existing.length >= target) {
    console.log(`No changes needed: already have ${existing.length} publications (target: ${target}).`);
    console.log(`Database location: ${DB_PATH}`);
    return;
  }

  const needed = target - existing.length;
  const generated = Array.from({ length: needed }, (_, offset) => {
    const absoluteIndex = existing.length + offset;
    const selectedWallet = walletPool[absoluteIndex % walletPool.length];
    return createPublication(absoluteIndex, selectedWallet);
  });

  const next = [...existing, ...generated];
  save(next);

  console.log(`Seed complete.`);
  console.log(`Added: ${generated.length}`);
  console.log(`Total: ${next.length}`);
  console.log(`Target: ${target}`);
  console.log(`Database location: ${DB_PATH}`);
  if (wallet) {
    console.log(`Wallet override: ${wallet}`);
  }
}

seedDatabase();
