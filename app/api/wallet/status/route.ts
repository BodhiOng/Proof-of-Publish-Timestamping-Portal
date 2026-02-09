import { NextRequest, NextResponse } from 'next/server';
import { isBackendSigningEnabled, getBackendAddress } from '@/lib/backend-signer';

// Check wallet connection status and available signing methods
export async function GET(request: NextRequest) {
  try {
    const backendSigningEnabled = isBackendSigningEnabled();
    
    return NextResponse.json({
      backendSigning: {
        enabled: backendSigningEnabled,
        address: backendSigningEnabled ? getBackendAddress() : null,
      },
      clientSigning: {
        metamask: true, // Always available if user has MetaMask
        walletConnect: true, // Always available
      },
      recommendations: {
        preferred: 'metamask',
        warning: 'Always use your own wallet (MetaMask/WalletConnect) in production.',
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
