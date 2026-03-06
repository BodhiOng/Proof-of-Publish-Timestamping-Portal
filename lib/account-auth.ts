import { randomUUID } from "crypto";

const NONCE_TTL_MS = 5 * 60 * 1000;

function normalizeWallet(wallet: string): string {
  return wallet.trim().toLowerCase();
}

function randomNonce(): string {
  return randomUUID();
}

export function issueWalletChallenge(wallet: string): { nonce: string; message: string; expiresAt: number } {
  const normalizedWallet = normalizeWallet(wallet);
  const nonce = randomNonce();
  const expiresAt = Date.now() + NONCE_TTL_MS;

  return {
    nonce,
    expiresAt,
    message: buildChallengeMessage(normalizedWallet, nonce, expiresAt),
  };
}

export function buildChallengeMessage(wallet: string, nonce: string, expiresAt: number): string {
  return [
    "ProofOfPublish Account Auth",
    `Wallet:${normalizeWallet(wallet)}`,
    `Nonce:${nonce}`,
    `ExpiresAt:${expiresAt}`,
  ].join("\n");
}

export function validateWalletChallengeMessage(
  wallet: string,
  challengeMessage: string
): { ok: true } | { ok: false; error: string } {
  const lines = challengeMessage.split("\n").map((line) => line.trim());
  if (lines.length < 4 || lines[0] !== "ProofOfPublish Account Auth") {
    return { ok: false, error: "Invalid challenge message format" };
  }

  const walletLine = lines.find((line) => line.startsWith("Wallet:"));
  const nonceLine = lines.find((line) => line.startsWith("Nonce:"));
  const expiresAtLine = lines.find((line) => line.startsWith("ExpiresAt:"));

  if (!walletLine || !nonceLine || !expiresAtLine) {
    return { ok: false, error: "Invalid challenge message format" };
  }

  const messageWallet = normalizeWallet(walletLine.slice("Wallet:".length));
  if (messageWallet !== normalizeWallet(wallet)) {
    return { ok: false, error: "Challenge wallet mismatch" };
  }

  const nonce = nonceLine.slice("Nonce:".length).trim();
  if (!nonce) {
    return { ok: false, error: "Challenge nonce is missing" };
  }

  const expiresAt = Number(expiresAtLine.slice("ExpiresAt:".length));
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    return { ok: false, error: "Challenge expired. Request a new challenge and try again." };
  }

  return { ok: true };
}
