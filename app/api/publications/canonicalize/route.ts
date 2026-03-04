import { NextRequest, NextResponse } from 'next/server';
import { canonicalizeContent, computeContentHash } from '@/lib/publication-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content } = body;

    if (typeof content !== 'string') {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const canonicalizedContent = canonicalizeContent(content);
    const contentHash = computeContentHash(canonicalizedContent);

    return NextResponse.json({
      canonicalizedContent,
      contentHash,
    });
  } catch (error) {
    console.error('Error canonicalizing content:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}