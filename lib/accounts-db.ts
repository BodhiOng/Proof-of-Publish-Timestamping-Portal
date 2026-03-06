import fs from "fs";
import path from "path";

const ACCOUNTS_DB_PATH = path.join(process.cwd(), "data", "accounts.json");

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

function ensureDataDir() {
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function initializeAccountsDb() {
  ensureDataDir();
  if (!fs.existsSync(ACCOUNTS_DB_PATH)) {
    fs.writeFileSync(ACCOUNTS_DB_PATH, JSON.stringify({ accounts: [] }, null, 2));
  }
}

function normalizeWallet(wallet: string): string {
  return wallet.trim().toLowerCase();
}

export function getAccounts(): AccountProfile[] {
  initializeAccountsDb();
  const data = fs.readFileSync(ACCOUNTS_DB_PATH, "utf-8");
  return JSON.parse(data).accounts;
}

export function getAccountByWallet(wallet: string): AccountProfile | null {
  const normalizedWallet = normalizeWallet(wallet);
  const accounts = getAccounts();
  return accounts.find((account) => normalizeWallet(account.wallet) === normalizedWallet) || null;
}

export function getAccountByUsername(username: string): AccountProfile | null {
  const normalizedUsername = username.trim().toLowerCase();
  const accounts = getAccounts();
  return accounts.find((account) => account.username.trim().toLowerCase() === normalizedUsername) || null;
}

export function createAccount(input: {
  wallet: string;
  username?: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  website?: string;
  location?: string;
}): AccountProfile {
  const now = new Date().toISOString();
  const accounts = getAccounts();
  const wallet = normalizeWallet(input.wallet);

  const existing = accounts.find((account) => normalizeWallet(account.wallet) === wallet);
  if (existing) {
    return existing;
  }

  const fallbackUsername = `user_${wallet.slice(2, 8)}`;
  const account: AccountProfile = {
    wallet,
    username: (input.username || fallbackUsername).trim(),
    displayName: (input.displayName || "").trim(),
    bio: (input.bio || "").trim(),
    avatarUrl: (input.avatarUrl || "").trim(),
    website: (input.website || "").trim(),
    location: (input.location || "").trim(),
    createdAt: now,
    updatedAt: now,
  };

  accounts.push(account);
  fs.writeFileSync(ACCOUNTS_DB_PATH, JSON.stringify({ accounts }, null, 2));
  return account;
}

export function updateAccountByWallet(
  wallet: string,
  updates: Partial<Pick<AccountProfile, "username" | "displayName" | "bio" | "avatarUrl" | "website" | "location">>
): AccountProfile | null {
  const normalizedWallet = normalizeWallet(wallet);
  const accounts = getAccounts();
  const index = accounts.findIndex((account) => normalizeWallet(account.wallet) === normalizedWallet);

  if (index === -1) {
    return null;
  }

  const current = accounts[index];
  const next: AccountProfile = {
    ...current,
    username: updates.username === undefined ? current.username : updates.username.trim(),
    displayName: updates.displayName === undefined ? current.displayName : updates.displayName.trim(),
    bio: updates.bio === undefined ? current.bio : updates.bio.trim(),
    avatarUrl: updates.avatarUrl === undefined ? current.avatarUrl : updates.avatarUrl.trim(),
    website: updates.website === undefined ? current.website : updates.website.trim(),
    location: updates.location === undefined ? current.location : updates.location.trim(),
    updatedAt: new Date().toISOString(),
  };

  accounts[index] = next;
  fs.writeFileSync(ACCOUNTS_DB_PATH, JSON.stringify({ accounts }, null, 2));
  return next;
}
