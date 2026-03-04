import { NextRequest, NextResponse } from 'next/server';
import { getPublicationById, synchronizePendingPublications, updatePublicationStatus } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    synchronizePendingPublications();
    const publication = getPublicationById(id);

    if (!publication) {
      return NextResponse.json(
        { error: 'Publication not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: publication.id,
      status: publication.status,
      txHash: publication.txHash,
      blockTimestamp: publication.blockTimestamp,
      createdAt: publication.createdAt,
    });
  } catch (error) {
    console.error('Error checking publication status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const publication = getPublicationById(id);

    if (!publication) {
      return NextResponse.json(
        { error: 'Publication not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const nextStatus = body?.status;

    if (nextStatus !== 'PENDING' && nextStatus !== 'CONFIRMED' && nextStatus !== 'FAILED') {
      return NextResponse.json(
        { error: 'Invalid status. Use PENDING, CONFIRMED, or FAILED.' },
        { status: 400 }
      );
    }

    const updated = updatePublicationStatus(id, nextStatus);
    if (!updated) {
      return NextResponse.json(
        { error: 'Failed to update status' },
        { status: 500 }
      );
    }

    const updatedPublication = getPublicationById(id);
    if (!updatedPublication) {
      return NextResponse.json(
        { error: 'Failed to fetch updated publication' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: updatedPublication.id,
      status: updatedPublication.status,
      txHash: updatedPublication.txHash,
      blockTimestamp: updatedPublication.blockTimestamp,
      createdAt: updatedPublication.createdAt,
    });
  } catch (error) {
    console.error('Error updating publication status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}