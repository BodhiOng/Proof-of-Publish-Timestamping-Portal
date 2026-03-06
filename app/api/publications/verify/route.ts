import { NextRequest, NextResponse } from 'next/server';
import { getPublicationsByHash } from '@/lib/db';
import { canonicalizeContent, computeContentHash, normalizeHashInput } from '@/lib/publication-utils';
import { scrapeSourceContent } from '@/lib/source-content';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contentHash, content, sourceUrl, fetchFromUrl } = body;

    let finalHash: string | undefined = normalizeHashInput(contentHash);

    if (!finalHash && typeof content === 'string' && content.length > 0) {
      finalHash = computeContentHash(canonicalizeContent(content));
    }

    if (!finalHash && fetchFromUrl === true && typeof sourceUrl === 'string' && sourceUrl.trim()) {
      const { content: urlContent } = await scrapeSourceContent(sourceUrl.trim());
      finalHash = computeContentHash(canonicalizeContent(urlContent));
    }

    if (!finalHash) {
      return NextResponse.json(
        { error: 'Provide contentHash, content, or sourceUrl with fetchFromUrl=true' },
        { status: 400 }
      );
    }

    // Find all publications with this content hash
    const matches = getPublicationsByHash(finalHash);

    if (matches.length === 0) {
      return NextResponse.json({
        hash: finalHash,
        matched: false,
        matches: [],
      });
    }

    // Return matched publications
    return NextResponse.json({
      hash: finalHash,
      matched: true,
      matches: matches.map(pub => ({
        publicationId: pub.id,
        publisher: pub.publisherWallet,
        timestamp: pub.blockTimestamp,
        txHash: pub.txHash,
        parentHash: pub.parentHash,
        title: pub.title,
        status: pub.status,
      })),
    });
  } catch (error) {
    console.error('Error verifying content:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
