import { NextRequest, NextResponse } from 'next/server';
import { scrapeSourceContent } from '@/lib/source-content';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sourceUrl = typeof body?.sourceUrl === 'string' ? body.sourceUrl.trim() : '';

    if (!sourceUrl) {
      return NextResponse.json({ error: 'Source URL is required' }, { status: 400 });
    }

    const { sourceUrl: normalizedUrl, title, content } = await scrapeSourceContent(sourceUrl);

    return NextResponse.json({
      sourceUrl: normalizedUrl,
      title,
      content,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to scrape content from URL';

    if (message === 'Invalid URL format' || message === 'Only HTTP/HTTPS URLs are supported') {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    if (message === 'No readable content found at URL') {
      return NextResponse.json({ error: message }, { status: 422 });
    }

    console.error('Error scraping publication source URL:', error);
    return NextResponse.json(
      { error: 'Failed to scrape content from URL' },
      { status: 500 }
    );
  }
}
