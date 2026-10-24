import { NextRequest, NextResponse } from "next/server";

import { mintTokensToWallet } from "@/lib/blockchain";
import { prisma } from "@/lib/prisma";

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

async function razorpayGet(path: string) {
  const response = await fetch(`${RAZORPAY_BASE_URL}${path}`, {
    method: "GET",
    headers: {
      Authorization: getRazorpayAuthHeader(),
      "Content-Type": "application/json",
    },
  });

  const payload = (await response.json().catch(() => ({}))) as any;

  if (!response.ok) {
    const description = String(payload.error?.description || payload.error?.reason || payload.error || "Razorpay API request failed");
    throw new Error(description);
  }

  return payload;
}

function normalizeStatus(rawStatus: string) {
  const status = rawStatus.toLowerCase();
  if (status === "paid") return "PAID";
  if (status === "cancelled" || status === "expired" || status === "failed") return "FAILED";
  return "PENDING";
}

async function processCallback(paymentLinkId: string, paymentStatus: string, paymentId: string) {
  if (!paymentLinkId) {
    return NextResponse.json({ error: "razorpay_payment_link_id is required" }, { status: 400 });
  }

  const payment = await prisma.onrampPayment.findUnique({ where: { orderId: paymentLinkId } });
  if (!payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  if (payment.status === "COMPLETED") {
    return NextResponse.json({ status: "already-completed", orderId: paymentLinkId, txHash: payment.txHash });
  }

  const localStatus = normalizeStatus(paymentStatus || "");
  if (localStatus === "FAILED") {
    await prisma.onrampPayment.update({
      where: { orderId: paymentLinkId },
      data: { status: "FAILED", checksum: paymentId || payment.checksum },
    });

    return NextResponse.json({ error: "Payment was not successful" }, { status: 400 });
  }

  const linkDetails = await razorpayGet(`/v1/payment_links/${paymentLinkId}`);
  const linkStatus = String(linkDetails.status || "").toLowerCase();

  if (linkStatus !== "paid") {
    await prisma.onrampPayment.update({
      where: { orderId: paymentLinkId },
      data: { status: "PENDING", checksum: paymentId || payment.checksum },
    });

    return NextResponse.json({ status: "pending", orderId: paymentLinkId });
  }

  if (paymentId) {
    const paymentDetails = await razorpayGet(`/v1/payments/${paymentId}`);
    const captureStatus = String(paymentDetails.status || "").toLowerCase();
    if (captureStatus !== "captured" && captureStatus !== "authorized") {
      await prisma.onrampPayment.update({
        where: { orderId: paymentLinkId },
        data: { status: "FAILED", checksum: paymentId },
      });

      return NextResponse.json({ error: "Razorpay payment not captured" }, { status: 400 });
    }
  }

  const mintReceipt = await mintTokensToWallet({
    walletAddress: payment.walletAddress,
    tokenAmount: payment.tokens,
  });

  await prisma.onrampPayment.update({
    where: { orderId: paymentLinkId },
    data: {
      status: "COMPLETED",
      txHash: mintReceipt.hash,
      checksum: paymentId || payment.checksum,
    },
  });

  const user = await prisma.user.findFirst({
    where: { walletAddress: payment.walletAddress },
    select: { id: true },
  });

  if (user) {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.tokenTransaction.findUnique({
        where: { txHash: mintReceipt.hash },
        select: { id: true },
      });

      if (existing) {
        await tx.tokenTransaction.update({
          where: { txHash: mintReceipt.hash },
          data: { status: "CONFIRMED" },
        });
        return;
      }

      await tx.user.update({
        where: { id: user.id },
        data: { tokens: { increment: payment.tokens } },
      });

      await tx.tokenTransaction.create({
        data: {
          txHash: mintReceipt.hash,
          userId: user.id,
          type: "ONRAMP_CREDIT",
          tokenAmount: payment.tokens,
          tokenPriceInr: Math.max(1, Math.round(payment.amount / Math.max(1, payment.tokens))),
          totalInr: payment.amount,
          status: "CONFIRMED",
          network: "2Gathers Testnet",
        },
      });
    });
  }

  return NextResponse.json({
    status: "completed",
    orderId: paymentLinkId,
    walletAddress: payment.walletAddress,
    txHash: mintReceipt.hash,
    blockNumber: mintReceipt.blockNumber,
  });
}

export async function GET(request: NextRequest) {
  const paymentLinkId = request.nextUrl.searchParams.get("razorpay_payment_link_id") || request.nextUrl.searchParams.get("orderId") || "";
  const paymentStatus = request.nextUrl.searchParams.get("razorpay_payment_link_status") || request.nextUrl.searchParams.get("status") || "";
  const paymentId = request.nextUrl.searchParams.get("razorpay_payment_id") || "";

  try {
    return await processCallback(paymentLinkId, paymentStatus, paymentId);
  } catch (error) {
    const status = mapRazorpayErrorStatus(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to process Razorpay callback" },
      { status },
    );
  }
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const paymentLinkId = String(body.razorpay_payment_link_id || body.orderId || "");
  const paymentStatus = String(body.razorpay_payment_link_status || body.status || "");
  const paymentId = String(body.razorpay_payment_id || "");

  try {
    return await processCallback(paymentLinkId, paymentStatus, paymentId);
  } catch (error) {
    const status = mapRazorpayErrorStatus(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to process Razorpay callback" },
      { status },
    );
  }
}
