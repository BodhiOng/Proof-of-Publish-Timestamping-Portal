import { NextRequest, NextResponse } from 'next/server';
import {
  isBackendSigningEnabled,
  signTransactionHash,
  logBackendSigning,
  checkRateLimit,
  getBackendAddress,
} from '@/lib/backend-signer';

export async function POST(request: NextRequest) {
  try {
    // Check if backend signing is enabled
    if (!isBackendSigningEnabled()) {
      return NextResponse.json(
        { error: 'Backend signing is disabled. Please use your own wallet.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { contentHash } = body;

    if (!contentHash) {
      return NextResponse.json(
        { error: 'Content hash is required' },
        { status: 400 }
      );
    }

    // Validate hash format
    if (!contentHash.match(/^0x[a-fA-F0-9]{64}$/)) {
      return NextResponse.json(
        { error: 'Invalid content hash format' },
        { status: 400 }
      );
    }

    // Rate limiting (prevent abuse)
    const clientIp = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    
    if (!checkRateLimit(clientIp, 10, 60000)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Try again later.' },
        { status: 429 }
      );
    }

    // Sign the content hash
    const { signature, signerAddress } = await signTransactionHash(contentHash);

    // Audit logging
    logBackendSigning(contentHash, signature, clientIp);

    // Return signature
    return NextResponse.json({
      signature,
      signerAddress,
      contentHash,
      timestamp: new Date().toISOString(),
      warning: 'Backend signing is less secure than using your own wallet.',
    });
  } catch (error) {
    console.error('Error signing with backend wallet:', error);
    return NextResponse.json(
      { error: 'Failed to sign transaction' },
      { status: 500 }
    );
  }
}

// Get backend wallet address (public endpoint)
export async function GET() {
  try {
    if (!isBackendSigningEnabled()) {
      return NextResponse.json(
        { error: 'Backend signing is disabled' },
        { status: 403 }
      );
    }

    const address = getBackendAddress();
    
    return NextResponse.json({
      address,
      enabled: true,
      warning: 'Backend signing is for testing only. Use your own wallet in production.',
    });
  } catch (error) {
    console.error('Error getting backend wallet address:', error);
    return NextResponse.json(
      { error: 'Failed to get wallet address' },
      { status: 500 }
    );
  }
}
