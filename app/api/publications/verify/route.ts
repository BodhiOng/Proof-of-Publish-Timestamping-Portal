import { NextRequest, NextResponse } from 'next/server';
import { getPublicationsByHash } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contentHash } = body;

    if (!contentHash) {
      return NextResponse.json(
        { error: 'Content hash is required' },
        { status: 400 }
      );
    }

    // Find all publications with this content hash
    const matches = getPublicationsByHash(contentHash);

    if (matches.length === 0) {
      return NextResponse.json({
        hash: contentHash,
        matched: false,
        matches: [],
      });
    }

    // Return matched publications
    return NextResponse.json({
      hash: contentHash,
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
