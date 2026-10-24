import { NextRequest, NextResponse } from "next/server";

import { getWalletState } from "@/lib/blockchain";
import { getAuthenticatedUserId } from "@/lib/server-auth";

export async function GET(request: NextRequest) {
  const userId = getAuthenticatedUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const wallet = await getWalletState(String(userId));
    return NextResponse.json({ wallet });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to read wallet state" },
      { status: 500 },
    );
  }
}
