import { NextRequest, NextResponse } from 'next/server';
import { getPublications, getPublicationsByWallet } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const wallet = searchParams.get('wallet');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

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

    return NextResponse.json({ publications });
  } catch (error) {
    console.error('Error fetching publications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
