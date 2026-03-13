import { query } from "@/lib/postgres";

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

type AccountRow = {
  wallet: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  website: string;
  location: string;
  created_at: Date | string;
  updated_at: Date | string;
};

function toIsoString(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function normalizeWallet(wallet: string): string {
  return wallet.trim().toLowerCase();
}

function mapAccountRow(row: AccountRow): AccountProfile {
  return {
    wallet: row.wallet,
    username: row.username,
    displayName: row.display_name,
    bio: row.bio,
    avatarUrl: row.avatar_url,
    website: row.website,
    location: row.location,
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),
  };
}

export async function getAccounts(): Promise<AccountProfile[]> {
  const result = await query<AccountRow>(
    `SELECT wallet, username, display_name, bio, avatar_url, website, location, created_at, updated_at
     FROM accounts
     ORDER BY created_at ASC`
  );
  return result.rows.map(mapAccountRow);
}

export async function getAccountByWallet(wallet: string): Promise<AccountProfile | null> {
  const result = await query<AccountRow>(
    `SELECT wallet, username, display_name, bio, avatar_url, website, location, created_at, updated_at
     FROM accounts
     WHERE wallet = $1
     LIMIT 1`,
    [normalizeWallet(wallet)]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapAccountRow(result.rows[0]);
}

export async function getAccountByUsername(username: string): Promise<AccountProfile | null> {
  const result = await query<AccountRow>(
    `SELECT wallet, username, display_name, bio, avatar_url, website, location, created_at, updated_at
     FROM accounts
     WHERE LOWER(username) = $1
     LIMIT 1`,
    [username.trim().toLowerCase()]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapAccountRow(result.rows[0]);
}

export async function createAccount(input: {
  wallet: string;
  username?: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  website?: string;
  location?: string;
}): Promise<AccountProfile> {
  const wallet = normalizeWallet(input.wallet);
  const existing = await getAccountByWallet(wallet);
  if (existing) {
    return existing;
  }

  const nowIso = new Date().toISOString();
  const fallbackUsername = `user_${wallet.slice(2, 8)}`;

  const result = await query<AccountRow>(
    `INSERT INTO accounts (
      wallet, username, display_name, bio, avatar_url, website, location, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    ON CONFLICT (wallet) DO NOTHING
    RETURNING wallet, username, display_name, bio, avatar_url, website, location, created_at, updated_at`,
    [
      wallet,
      (input.username || fallbackUsername).trim(),
      (input.displayName || "").trim(),
      (input.bio || "").trim(),
      (input.avatarUrl || "").trim(),
      (input.website || "").trim(),
      (input.location || "").trim(),
      nowIso,
      nowIso,
    ]
  );

  if (result.rows.length === 0) {
    const reloaded = await getAccountByWallet(wallet);
    if (!reloaded) {
      throw new Error("Failed to create account");
    }
    return reloaded;
  }

  return mapAccountRow(result.rows[0]);
}

export async function updateAccountByWallet(
  wallet: string,
  updates: Partial<Pick<AccountProfile, "username" | "displayName" | "bio" | "avatarUrl" | "website" | "location">>
): Promise<AccountProfile | null> {
  const current = await getAccountByWallet(wallet);
  if (!current) {
    return null;
  }

  const result = await query<AccountRow>(
    `UPDATE accounts
     SET username = $2,
         display_name = $3,
         bio = $4,
         avatar_url = $5,
         website = $6,
         location = $7,
         updated_at = $8
     WHERE wallet = $1
     RETURNING wallet, username, display_name, bio, avatar_url, website, location, created_at, updated_at`,
    [
      normalizeWallet(wallet),
      updates.username === undefined ? current.username : updates.username.trim(),
      updates.displayName === undefined ? current.displayName : updates.displayName.trim(),
      updates.bio === undefined ? current.bio : updates.bio.trim(),
      updates.avatarUrl === undefined ? current.avatarUrl : updates.avatarUrl.trim(),
      updates.website === undefined ? current.website : updates.website.trim(),
      updates.location === undefined ? current.location : updates.location.trim(),
      new Date().toISOString(),
    ]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapAccountRow(result.rows[0]);
}
