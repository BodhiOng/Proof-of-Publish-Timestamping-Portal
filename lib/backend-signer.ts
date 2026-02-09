// Backend signing service (OPTIONAL - for testing/development only)
// In production, users should ALWAYS sign with their own wallet

import { Wallet } from 'ethers';
import crypto from 'crypto';

// WARNING: This is for development/testing only
// NEVER use backend signing in production with real funds
const BACKEND_PRIVATE_KEY = process.env.BACKEND_SIGNER_PRIVATE_KEY || 
  '0x0000000000000000000000000000000000000000000000000000000000000001';

// Create a wallet instance
let backendWallet: Wallet | null = null;

export function getBackendWallet(): Wallet {
  if (!backendWallet) {
    backendWallet = new Wallet(BACKEND_PRIVATE_KEY);
  }
  return backendWallet;
}

export function getBackendAddress(): string {
  return getBackendWallet().address;
}

// Sign a message with backend wallet
export async function signMessage(message: string): Promise<string> {
  const wallet = getBackendWallet();
  return await wallet.signMessage(message);
}

// Sign a transaction hash (for proof of publish)
export async function signTransactionHash(hash: string): Promise<{
  signature: string;
  signerAddress: string;
}> {
  const wallet = getBackendWallet();
  const signature = await wallet.signMessage(hash);
  
  return {
    signature,
    signerAddress: wallet.address,
  };
}

// Generate a new wallet for backend signing (dev utility)
export function generateNewBackendWallet(): {
  privateKey: string;
  address: string;
  mnemonic: string;
} {
  const wallet = Wallet.createRandom();
  
  return {
    privateKey: wallet.privateKey,
    address: wallet.address,
    mnemonic: wallet.mnemonic?.phrase || '',
  };
}

// Audit log for backend signing (security)
type SigningLog = {
  timestamp: string;
  signerAddress: string;
  contentHash: string;
  signature: string;
  ipAddress?: string;
};

const signingLogs: SigningLog[] = [];

export function logBackendSigning(
  contentHash: string,
  signature: string,
  ipAddress?: string
): void {
  const log: SigningLog = {
    timestamp: new Date().toISOString(),
    signerAddress: getBackendAddress(),
    contentHash,
    signature,
    ipAddress,
  };
  
  signingLogs.push(log);
  
  // In production, write to database or file
  console.log('[BACKEND SIGNING AUDIT]', log);
}

export function getSigningLogs(): SigningLog[] {
  return [...signingLogs];
}

// Check if backend signing is enabled
export function isBackendSigningEnabled(): boolean {
  return process.env.ENABLE_BACKEND_SIGNING === 'true';
}

// Rate limiting for backend signing (prevent abuse)
const rateLimitMap = new Map<string, number[]>();

export function checkRateLimit(identifier: string, maxRequests = 10, windowMs = 60000): boolean {
  const now = Date.now();
  const requests = rateLimitMap.get(identifier) || [];
  
  // Remove old requests outside the time window
  const recentRequests = requests.filter(time => now - time < windowMs);
  
  if (recentRequests.length >= maxRequests) {
    return false; // Rate limit exceeded
  }
  
  recentRequests.push(now);
  rateLimitMap.set(identifier, recentRequests);
  
  return true;
}
