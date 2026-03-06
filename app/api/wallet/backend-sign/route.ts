import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Backend signing is permanently disabled. Connect and sign with your own wallet." },
    { status: 403 }
  );
}

export async function GET() {
  return NextResponse.json(
    { error: "Backend signing is permanently disabled. Connect and sign with your own wallet." },
    { status: 403 }
  );
}
