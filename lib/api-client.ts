export type PublicationStatus = 'PENDING' | 'CONFIRMED' | 'FAILED';

export type Publication = {
  id: string;
  title: string;
  contentType: string;
  canonicalizedContent: string;
  sourceUrl?: string;
  publisherWallet: string;
  contentHash: string;
  parentHash?: string;
  txHash: string;
  blockTimestamp: string;
  status: PublicationStatus;
  createdAt: string;
};

export type PublicationWithVersionLinks = Publication & {
  prevVersion: string | null;
  nextVersion: string | null;
};

export type PublicationStatusResponse = {
  id: string;
  status: PublicationStatus;
  txHash: string;
  blockTimestamp: string;
  createdAt: string;
};

export type PublicationsListResponse = {
  publications: Publication[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  sync: {
    updated: number;
    confirmed: number;
    failed: number;
  } | null;
};

export type VerifyResponse = {
  hash: string;
  matched: boolean;
  matches: Array<{
    publicationId: string;
    publisher: string;
    timestamp: string;
    txHash: string;
    parentHash?: string;
    title?: string;
    status: PublicationStatus;
  }>;
};

export type WalletStatusResponse = {
  clientSigning: {
    metamask: boolean;
    walletConnect: boolean;
  };
  recommendations: {
    preferred: string;
    warning: string;
  };
};

export type AccountProfile = {
  wallet: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  website: string;
  location: string;
  createdAt: string;
  updatedAt: string;
};

export type AccountChallengeResponse = {
  nonce: string;
  message: string;
  expiresAt: number;
};

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
};

async function requestJson<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, ...rest } = options;
  const response = await fetch(url, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error || 'Request failed');
  }

  return data as T;
}

export async function canonicalizePublicationContent(content: string): Promise<{
  canonicalizedContent: string;
  contentHash: string;
}> {
  return requestJson('/api/publications/canonicalize', {
    method: 'POST',
    body: { content },
  });
}

export async function createPublication(payload: {
  title: string;
  contentType: string;
  canonicalizedContent: string;
  contentHash: string;
  sourceUrl?: string;
  parentHash?: string;
  publisherWallet: string;
  txHash?: string;
  blockTimestamp?: string;
  status?: PublicationStatus;
}): Promise<{ publication: Publication }> {
  return requestJson('/api/publications', {
    method: 'POST',
    body: payload,
  });
}

export async function getPublications(query?: {
  wallet?: string;
  status?: PublicationStatus | 'ALL';
  search?: string;
  contentType?: string;
  sortBy?: 'newest' | 'oldest' | 'title_asc' | 'title_desc' | 'type_asc';
  page?: number;
  limit?: number;
  sync?: boolean;
}): Promise<PublicationsListResponse> {
  const params = new URLSearchParams();
  if (query?.wallet) params.set('wallet', query.wallet);
  if (query?.status) params.set('status', query.status);
  if (query?.search) params.set('search', query.search);
  if (query?.contentType) params.set('contentType', query.contentType);
  if (query?.sortBy) params.set('sortBy', query.sortBy);
  if (query?.page) params.set('page', String(query.page));
  if (query?.limit) params.set('limit', String(query.limit));
  if (query?.sync) params.set('sync', 'true');

  const suffix = params.toString();
  return requestJson(`/api/publications${suffix ? `?${suffix}` : ''}`);
}

export async function getPublicationById(id: string): Promise<PublicationWithVersionLinks> {
  return requestJson(`/api/publications/${id}`);
}

export async function deletePublication(id: string, wallet: string): Promise<{ deleted: boolean; id: string }> {
  return requestJson(`/api/publications/${id}`, {
    method: 'DELETE',
    body: { wallet },
  });
}

export async function getPublicationStatus(id: string): Promise<PublicationStatusResponse> {
  return requestJson(`/api/publications/${id}/status`);
}

export async function updatePublicationStatus(
  id: string,
  status: PublicationStatus
): Promise<PublicationStatusResponse> {
  return requestJson(`/api/publications/${id}/status`, {
    method: 'PATCH',
    body: { status },
  });
}

export async function syncPublications(): Promise<{
  message: string;
  updated: number;
  confirmed: number;
  failed: number;
}> {
  return requestJson('/api/publications/sync', { method: 'POST' });
}

export async function verifyPublicationContent(input: {
  contentHash?: string;
  content?: string;
  sourceUrl?: string;
  fetchFromUrl?: boolean;
}): Promise<VerifyResponse> {
  return requestJson('/api/publications/verify', {
    method: 'POST',
    body: input,
  });
}

export async function getWalletStatus(): Promise<WalletStatusResponse> {
  return requestJson('/api/wallet/status');
}

export async function scrapePublicationSource(sourceUrl: string): Promise<{
  sourceUrl: string;
  title?: string;
  content: string;
}> {
  return requestJson('/api/publications/scrape', {
    method: 'POST',
    body: { sourceUrl },
  });
}

export async function issueAccountChallenge(wallet: string): Promise<AccountChallengeResponse> {
  return requestJson('/api/accounts/challenge', {
    method: 'POST',
    body: { wallet },
  });
}

export async function getAccountProfile(wallet: string): Promise<{ account: AccountProfile | null }> {
  const params = new URLSearchParams({ wallet });
  return requestJson(`/api/accounts/profile?${params.toString()}`);
}

export async function createAccountProfile(payload: {
  wallet: string;
  signature: string;
  challengeMessage: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  website: string;
  location: string;
}): Promise<{ account: AccountProfile; created: boolean }> {
  return requestJson('/api/accounts/profile', {
    method: 'POST',
    body: payload,
  });
}

export async function updateAccountProfile(payload: {
  wallet: string;
  signature: string;
  challengeMessage: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  website: string;
  location: string;
}): Promise<{ account: AccountProfile; updated: boolean }> {
  return requestJson('/api/accounts/profile', {
    method: 'PATCH',
    body: payload,
  });
}