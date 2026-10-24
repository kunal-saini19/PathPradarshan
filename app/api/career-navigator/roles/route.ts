import { NextResponse } from "next/server";
import { ensureCareerFrameworks } from "@/lib/career-navigator-db";

export async function GET() {
  try {
    const roles = await ensureCareerFrameworks();
    return NextResponse.json({ roles });
  } catch (error) {
    console.error("Career role framework error", error instanceof Error ? { message: error.message } : { message: "unknown" });
    return NextResponse.json({ detail: "Unable to load role frameworks" }, { status: 500 });
  }
}