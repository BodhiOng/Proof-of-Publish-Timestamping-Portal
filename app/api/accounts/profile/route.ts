import { NextRequest, NextResponse } from "next/server";
import { getAddress, verifyMessage } from "ethers";
import { validateWalletChallengeMessage } from "@/lib/account-auth";
import {
  createAccount,
  getAccountByUsername,
  getAccountByWallet,
  updateAccountByWallet,
} from "@/lib/accounts-db";

function normalizeWallet(wallet: string): string {
  return wallet.trim().toLowerCase();
}

function isWalletAddress(value: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

function isValidUsername(username: string): boolean {
  return /^[a-zA-Z0-9_]{3,24}$/.test(username);
}

function sanitizeField(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function validateProfileInput(payload: Record<string, unknown>) {
  const username = sanitizeField(payload.username);
  const displayName = sanitizeField(payload.displayName);
  const bio = sanitizeField(payload.bio);
  const avatarUrl = sanitizeField(payload.avatarUrl);
  const website = sanitizeField(payload.website);
  const location = sanitizeField(payload.location);

  if (!username || !isValidUsername(username)) {
    return { error: "Username must be 3-24 chars and only contain letters, numbers, or underscore" };
  }

  if (displayName.length > 80) {
    return { error: "Display name must be 80 characters or less" };
  }

  if (bio.length > 240) {
    return { error: "Bio must be 240 characters or less" };
  }

  if (location.length > 80) {
    return { error: "Location must be 80 characters or less" };
  }

  const isDataAvatar = /^data:image\/[a-zA-Z0-9.+-]+;base64,/i.test(avatarUrl);

  if (avatarUrl && !isDataAvatar) {
    return { error: "Profile picture must be uploaded as an image file" };
  }

  if (isDataAvatar && avatarUrl.length > 3_000_000) {
    return { error: "Uploaded avatar image is too large" };
  }

  if (website && !/^https?:\/\//i.test(website)) {
    return { error: "Website must start with http:// or https://" };
  }

  return {
    value: {
      username,
      displayName,
      bio,
      avatarUrl,
      website,
      location,
    },
  };
}

function verifyWalletSignature(
  wallet: string,
  signature: string,
  challengeMessage: string
): { ok: true } | { ok: false; error: string } {
  const challengeValidation = validateWalletChallengeMessage(wallet, challengeMessage);
  if (!challengeValidation.ok) {
    return challengeValidation;
  }

  try {
    const recovered = verifyMessage(challengeMessage, signature);
    const recoveredChecksum = getAddress(recovered);
    const walletChecksum = getAddress(wallet);

    if (recoveredChecksum !== walletChecksum) {
      return { ok: false, error: "Wallet signature does not match the selected wallet" };
    }

    return { ok: true };
  } catch {
    return { ok: false, error: "Invalid signature" };
  }
}

export async function GET(request: NextRequest) {
  try {
    const wallet = request.nextUrl.searchParams.get("wallet")?.trim() || "";

    if (!wallet || !isWalletAddress(wallet)) {
      return NextResponse.json({ error: "A valid wallet address is required" }, { status: 400 });
    }

    const account = getAccountByWallet(wallet);
    return NextResponse.json({ account });
  } catch (error) {
    console.error("Failed to load account profile:", error);
    return NextResponse.json({ error: "Failed to load account" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const wallet = sanitizeField(body.wallet).toLowerCase();
    const signature = sanitizeField(body.signature);
    const challengeMessage = sanitizeField(body.challengeMessage);

    if (!wallet || !isWalletAddress(wallet)) {
      return NextResponse.json({ error: "A valid wallet address is required" }, { status: 400 });
    }

    if (!signature) {
      return NextResponse.json({ error: "Signature is required" }, { status: 400 });
    }

    if (!challengeMessage) {
      return NextResponse.json({ error: "Challenge message is required" }, { status: 400 });
    }

    const validation = validateProfileInput(body);
    if ("error" in validation) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const signatureValidation = verifyWalletSignature(wallet, signature, challengeMessage);
    if (!signatureValidation.ok) {
      return NextResponse.json({ error: signatureValidation.error }, { status: 401 });
    }

    const existingByUsername = getAccountByUsername(validation.value.username);
    if (existingByUsername && normalizeWallet(existingByUsername.wallet) !== normalizeWallet(wallet)) {
      return NextResponse.json({ error: "Username is already taken" }, { status: 409 });
    }

    const existing = getAccountByWallet(wallet);
    if (existing) {
      return NextResponse.json({ account: existing, created: false });
    }

    const created = createAccount({ wallet, ...validation.value });
    return NextResponse.json({ account: created, created: true });
  } catch (error) {
    console.error("Failed to create account profile:", error);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const wallet = sanitizeField(body.wallet).toLowerCase();
    const signature = sanitizeField(body.signature);
    const challengeMessage = sanitizeField(body.challengeMessage);

    if (!wallet || !isWalletAddress(wallet)) {
      return NextResponse.json({ error: "A valid wallet address is required" }, { status: 400 });
    }

    if (!signature) {
      return NextResponse.json({ error: "Signature is required" }, { status: 400 });
    }

    if (!challengeMessage) {
      return NextResponse.json({ error: "Challenge message is required" }, { status: 400 });
    }

    const validation = validateProfileInput(body);
    if ("error" in validation) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const signatureValidation = verifyWalletSignature(wallet, signature, challengeMessage);
    if (!signatureValidation.ok) {
      return NextResponse.json({ error: signatureValidation.error }, { status: 401 });
    }

    const existingByUsername = getAccountByUsername(validation.value.username);
    if (existingByUsername && normalizeWallet(existingByUsername.wallet) !== normalizeWallet(wallet)) {
      return NextResponse.json({ error: "Username is already taken" }, { status: 409 });
    }

    const updated = updateAccountByWallet(wallet, validation.value);
    if (!updated) {
      return NextResponse.json({ error: "Account not found. Create account first." }, { status: 404 });
    }

    return NextResponse.json({ account: updated, updated: true });
  } catch (error) {
    console.error("Failed to update account profile:", error);
    return NextResponse.json({ error: "Failed to update account" }, { status: 500 });
  }
}
