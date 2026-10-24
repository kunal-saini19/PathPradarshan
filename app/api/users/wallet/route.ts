import { NextRequest, NextResponse } from "next/server";

import { linkWalletAddress } from "@/lib/blockchain";
import { getAuthenticatedUserId } from "@/lib/server-auth";

export async function POST(request: NextRequest) {
  try {
    const userId = getAuthenticatedUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const walletAddress = String(body.walletAddress || "");

    if (!walletAddress) {
      return NextResponse.json({ error: "walletAddress is required" }, { status: 400 });
    }

    const user = await linkWalletAddress(String(userId), walletAddress);
    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to link wallet address" },
      { status: 400 },
    );
  }
}
