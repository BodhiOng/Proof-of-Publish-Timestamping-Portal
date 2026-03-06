import { NextRequest, NextResponse } from 'next/server';

// Check wallet connection status and available signing methods
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      clientSigning: {
        metamask: true, // Always available if user has MetaMask
        walletConnect: true, // Always available
      },
      recommendations: {
        preferred: 'metamask',
        warning: 'Wallet connection is required for all users. Backend signing is not available.',
      },
    });
  } catch (error) {
    console.error('Error checking wallet status:', error);
    return NextResponse.json(
      { error: 'Failed to check wallet status' },
      { status: 500 }
    );
  }
}
