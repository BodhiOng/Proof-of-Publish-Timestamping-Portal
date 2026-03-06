import { NextRequest, NextResponse } from "next/server";
import { issueWalletChallenge } from "@/lib/account-auth";

function isWalletAddress(value: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const wallet = (body?.wallet || "").trim();

    if (!wallet || !isWalletAddress(wallet)) {
      return NextResponse.json({ error: "A valid wallet address is required" }, { status: 400 });
    }

    const challenge = issueWalletChallenge(wallet);
    return NextResponse.json(challenge);
  } catch (error) {
    console.error("Failed to issue account challenge:", error);
    return NextResponse.json({ error: "Failed to issue challenge" }, { status: 500 });
  }
}
