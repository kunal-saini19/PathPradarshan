import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/server-auth";

const DEFAULT_TOKENS_PER_INR = Number(process.env.RAZORPAY_TOKENS_PER_INR || "10");
const RAZORPAY_BASE_URL = process.env.RAZORPAY_BASE_URL || "https://api.razorpay.com";

function mapRazorpayErrorStatus(error: unknown) {
  const message = error instanceof Error ? error.message : "";

  if (message.toLowerCase().includes("not configured")) {
    return 503;
  }

  if (message.toLowerCase().includes("razorpay")) {
    return 502;
  }

  return 500;
}

function getRazorpayAuthHeader() {
  const keyId = process.env.RAZORPAY_KEY_ID || "";
  const keySecret = process.env.RAZORPAY_KEY_SECRET || "";

  if (!keyId || !keySecret) {
    throw new Error("Razorpay key id/secret is not configured");
  }

  return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
}

async function razorpayRequest(path: string, body: unknown) {
  const response = await fetch(`${RAZORPAY_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      Authorization: getRazorpayAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const payload = (await response.json().catch(() => ({}))) as any;

  if (!response.ok) {
    const description = String(payload.error?.description || payload.error?.reason || payload.error || "Razorpay API request failed");
    throw new Error(description);
  }

  return payload;
}

export async function POST(request: NextRequest) {
  try {
    const authUserId = getAuthenticatedUserId(request);
    if (!authUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const amountInInr = Number(body.amount || 0);

    if (!Number.isFinite(amountInInr) || amountInInr <= 0) {
      return NextResponse.json({ error: "amount is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: authUserId },
      select: { id: true, walletAddress: true, username: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.walletAddress) {
      return NextResponse.json({ error: "Link a wallet address before buying tokens" }, { status: 400 });
    }

    const amountInPaise = Math.round(amountInInr * 100);
    const tokens = Math.max(1, Math.round(amountInInr * DEFAULT_TOKENS_PER_INR));
    const referenceId = `2GT-${user.id}-${Date.now()}`;
    const origin = new URL(request.url).origin;

    const paymentLink = await razorpayRequest("/v1/payment_links", {
      amount: amountInPaise,
      currency: "INR",
      accept_partial: false,
      description: "2Gathers token purchase",
      reference_id: referenceId,
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL || origin}/api/payment/razorpay/callback`,
      callback_method: "get",
      customer: {
        name: user.username || `user-${user.id}`,
        email: user.email || undefined,
      },
      notify: {
        sms: false,
        email: false,
      },
      notes: {
        walletAddress: user.walletAddress,
        tokens: String(tokens),
        userId: String(user.id),
      },
    });

    const orderId = String(paymentLink.id || "");
    const paymentUrl = String(paymentLink.short_url || "");

    if (!orderId || !paymentUrl) {
      throw new Error("Razorpay did not return a payment link URL");
    }

    await prisma.onrampPayment.create({
      data: {
        orderId,
        walletAddress: user.walletAddress,
        amount: amountInPaise,
        tokens,
        status: "PENDING",
        checksum: referenceId,
      },
    });

    return NextResponse.json({
      orderId,
      paymentUrl,
      tokens,
      amount: amountInInr,
      walletAddress: user.walletAddress,
      gateway: "razorpay",
    });
  } catch (error) {
    const status = mapRazorpayErrorStatus(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to initiate Razorpay payment" },
      { status },
    );
  }
}
