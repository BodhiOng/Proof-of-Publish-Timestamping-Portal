import { NextResponse } from 'next/server';
import { synchronizePendingPublications } from '@/lib/db';

export async function POST() {
  try {
    const result = synchronizePendingPublications();
    return NextResponse.json({
      message: 'Synchronization complete',
      ...result,
    });
  } catch (error) {
    console.error('Error synchronizing publications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}