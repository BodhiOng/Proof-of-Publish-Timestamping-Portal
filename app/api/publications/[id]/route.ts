import { NextRequest, NextResponse } from 'next/server';
import { deletePublicationByIdAndWallet, getPublicationById, getNextVersion, getPreviousVersion } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch publication by ID
    const publication = getPublicationById(id);

    if (!publication) {
      return NextResponse.json(
        { error: 'Publication not found' },
        { status: 404 }
      );
    }

    // Find version chain information
    let prevVersionId: string | null = null;
    let nextVersionId: string | null = null;

    if (publication.parentHash) {
      const prevVersion = getPreviousVersion(publication.parentHash);
      if (prevVersion) {
        prevVersionId = prevVersion.id;
      }
    }

    const nextVersion = getNextVersion(publication.contentHash);
    if (nextVersion) {
      nextVersionId = nextVersion.id;
    }

    // Return publication with version chain info
    return NextResponse.json({
      ...publication,
      prevVersion: prevVersionId,
      nextVersion: nextVersionId,
    });
  } catch (error) {
    console.error('Error fetching publication:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const wallet = typeof body?.wallet === 'string' ? body.wallet.trim() : '';

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet is required' },
        { status: 400 }
      );
    }

    const result = deletePublicationByIdAndWallet(id, wallet);

    if (!result.deleted && result.reason === 'not-found') {
      return NextResponse.json(
        { error: 'Publication not found' },
        { status: 404 }
      );
    }

    if (!result.deleted && result.reason === 'forbidden') {
      return NextResponse.json(
        { error: 'You can only delete publications tied to your connected wallet' },
        { status: 403 }
      );
    }

    return NextResponse.json({ deleted: true, id });
  } catch (error) {
    console.error('Error deleting publication:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
