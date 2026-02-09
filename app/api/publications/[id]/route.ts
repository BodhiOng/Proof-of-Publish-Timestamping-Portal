import { NextRequest, NextResponse } from 'next/server';
import { getPublicationById, getNextVersion, getPreviousVersion } from '@/lib/db';

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
