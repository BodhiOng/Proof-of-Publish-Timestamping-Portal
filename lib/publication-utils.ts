import crypto from 'crypto';

export function canonicalizeContent(content: string): string {
  return content
    .trim()
    .replace(/\r\n/g, '\n')
    .replace(/\s+$/gm, '')
    .normalize('NFC');
}

export function computeContentHash(canonicalizedContent: string): string {
  const hash = crypto.createHash('sha256').update(canonicalizedContent, 'utf8').digest('hex');
  return `0x${hash}`;
}

export function generatePublicationId(): string {
  return `${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
}

export function generateMockTxHash(): string {
  return `0x${crypto.randomBytes(32).toString('hex')}`;
}

export function normalizeHashInput(value?: string): string | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  if (!/^0x[a-f0-9]{64}$/.test(normalized)) {
    return undefined;
  }
  return normalized;
}