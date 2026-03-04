import { NextRequest, NextResponse } from 'next/server';
import { addPublication, getPublications, getPublicationsByWallet, synchronizePendingPublications } from '@/lib/db';
import {
  canonicalizeContent,
  computeContentHash,
  generateMockTxHash,
  generatePublicationId,
  normalizeHashInput,
} from '@/lib/publication-utils';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

function parsePositiveInt(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) return fallback;
  return parsed;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const wallet = searchParams.get('wallet');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parsePositiveInt(searchParams.get('page'), DEFAULT_PAGE);
    const requestedLimit = parsePositiveInt(searchParams.get('limit'), DEFAULT_LIMIT);
    const limit = Math.min(requestedLimit, MAX_LIMIT);
    const sync = searchParams.get('sync') === 'true';

    const syncResult = sync ? synchronizePendingPublications() : null;

    let publications = wallet 
      ? getPublicationsByWallet(wallet)
      : getPublications();

    // Filter by status if provided
    if (status && status !== 'ALL') {
      publications = publications.filter(p => p.status === status);
    }

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      publications = publications.filter(p => 
        p.title.toLowerCase().includes(searchLower) ||
        p.contentHash.toLowerCase().includes(searchLower) ||
        p.id.includes(searchLower)
      );
    }

    // Sort by creation date (newest first)
    publications.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const total = publications.length;
    const start = (page - 1) * limit;
    const paginated = publications.slice(start, start + limit);

    return NextResponse.json({
      publications: paginated,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
      sync: syncResult,
    });
  } catch (error) {
    console.error('Error fetching publications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      contentType,
      content,
      canonicalizedContent,
      contentHash,
      sourceUrl,
      parentHash,
      publisherWallet,
      txHash,
      status,
    } = body;

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    if (!publisherWallet || typeof publisherWallet !== 'string') {
      return NextResponse.json({ error: 'Publisher wallet is required' }, { status: 400 });
    }

    if (!contentType || typeof contentType !== 'string') {
      return NextResponse.json({ error: 'Content type is required' }, { status: 400 });
    }

    const rawContent = typeof canonicalizedContent === 'string'
      ? canonicalizedContent
      : typeof content === 'string'
        ? canonicalizeContent(content)
        : null;

    if (rawContent === null) {
      return NextResponse.json(
        { error: 'Either content or canonicalizedContent is required' },
        { status: 400 }
      );
    }

    const normalizedCanonicalized = canonicalizeContent(rawContent);
    const computedHash = computeContentHash(normalizedCanonicalized);
    if (contentHash && typeof contentHash === 'string' && contentHash.toLowerCase() !== computedHash) {
      return NextResponse.json(
        { error: 'Provided content hash does not match canonicalized content' },
        { status: 400 }
      );
    }

    const normalizedParentHash = normalizeHashInput(parentHash);
    if (parentHash && !normalizedParentHash) {
      return NextResponse.json({ error: 'Invalid parent hash format' }, { status: 400 });
    }

    const normalizedStatus = status === 'CONFIRMED' || status === 'FAILED' || status === 'PENDING'
      ? status
      : 'PENDING';

    const now = new Date().toISOString();
    const publication = {
      id: generatePublicationId(),
      title: title.trim(),
      contentType,
      canonicalizedContent: normalizedCanonicalized,
      sourceUrl: typeof sourceUrl === 'string' && sourceUrl.trim() ? sourceUrl.trim() : undefined,
      publisherWallet,
      contentHash: computedHash,
      parentHash: normalizedParentHash,
      txHash: typeof txHash === 'string' && txHash.trim() ? txHash.trim() : generateMockTxHash(),
      blockTimestamp: now,
      status: normalizedStatus,
      createdAt: now,
    } as const;

    addPublication(publication);

    return NextResponse.json({ publication }, { status: 201 });
  } catch (error) {
    console.error('Error creating publication:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
