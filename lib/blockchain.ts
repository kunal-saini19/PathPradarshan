import "server-only";

import { ethers } from "ethers";

import { prisma } from "@/lib/prisma";

const TOKEN_DECIMALS = 18;
const TOKEN_CONTRACT_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function mint(address to, uint256 amount)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
];

export type BlockchainLedgerTransaction = {
  id: string;
  hash: string;
  type: "mint" | "receive" | "send";
  label: string;
  amount: number;
  balanceAfter: number;
  createdAt: string;
  from?: string;
  to?: string;
};

export type BlockchainWalletState = {
  userId: string;
  walletAddress: string | null;
  balance: number;
  contractAddress: string | null;
  transactions: BlockchainLedgerTransaction[];
};

function requireRpcUrl() {
  return process.env.NEXT_PUBLIC_CHAIN_RPC_URL || process.env.SEPOLIA_RPC_URL || process.env.POLYGON_AMOY_RPC_URL || "";
}

function getProvider() {
  const rpcUrl = requireRpcUrl();
  if (!rpcUrl) {
    throw new Error("Missing chain RPC URL");
  }

  return new ethers.JsonRpcProvider(rpcUrl);
}

function getContractAddress() {
  return process.env.NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS || "";
}

export function getTokenContract(readonlyProvider?: ethers.ContractRunner) {
  const contractAddress = getContractAddress();
  if (!contractAddress) {
    throw new Error("Missing token contract address");
  }

  return new ethers.Contract(contractAddress, TOKEN_CONTRACT_ABI, readonlyProvider ?? getProvider());
}

export async function linkWalletAddress(userId: string, walletAddress: string) {
  if (!ethers.isAddress(walletAddress)) {
    throw new Error("Invalid wallet address");
  }

  const numericUserId = Number(userId);
  if (!Number.isFinite(numericUserId)) {
    throw new TypeError("Invalid user id");
  }

  const existing = await prisma.user.findFirst({
    where: {
      walletAddress,
      NOT: {
        id: numericUserId,
      },
    },
    select: { id: true },
  });

  if (existing) {
    throw new Error("This wallet address is already linked to another account");
  }

  const updated = await prisma.user.update({
    where: { id: Number(userId) },
    data: { walletAddress },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      walletAddress: true,
    },
  });

  return updated;
}

export async function getWalletState(userId: string): Promise<BlockchainWalletState> {
  const numericUserId = Number(userId);
  if (!Number.isFinite(numericUserId)) {
    return {
      userId,
      walletAddress: null,
      balance: 0,
      contractAddress: getContractAddress() || null,
      transactions: [],
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: numericUserId },
    select: { id: true, walletAddress: true, tokens: true },
  });

  if (!user) {
    return {
      userId,
      walletAddress: null,
      balance: 0,
      contractAddress: getContractAddress() || null,
      transactions: [],
    };
  }

  const tokenTxs = await prisma.tokenTransaction.findMany({
    where: { userId: numericUserId, status: "CONFIRMED" },
    orderBy: { createdAt: "desc" },
    take: 60,
  });

  const transactions: BlockchainLedgerTransaction[] = tokenTxs.map((tx) => {
    const isDebit = tx.type === "JOB_APPLY_DEBIT";
    let label = "Bought tokens";
    if (isDebit) {
      label = "Applied to job";
    } else if (tx.type === "TASK_REWARD_CREDIT") {
      label = "Task reward";
    }
    const amount = isDebit ? -Math.abs(tx.tokenAmount) : Math.abs(tx.tokenAmount);
    const from = isDebit ? undefined : tx.network;
    const to = isDebit ? tx.network : undefined;
    return {
      id: String(tx.id),
      hash: tx.txHash,
      type: isDebit ? "send" : "mint",
      label,
      amount,
      balanceAfter: 0,
      createdAt: tx.createdAt.toISOString(),
      to,
      from,
    };
  });

  let running = user.tokens;
  const withBalances = transactions.map((tx) => {
    const row = {
      ...tx,
      balanceAfter: Number(running.toFixed(6)),
    };
    running -= tx.amount;
    return row;
  });

  return {
    userId,
    walletAddress: user.walletAddress,
    balance: user.tokens,
    contractAddress: getContractAddress() || null,
    transactions: withBalances,
  };
}

export async function mintTokensToWallet(params: { walletAddress: string; tokenAmount: number }) {
  if (!ethers.isAddress(params.walletAddress)) {
    throw new Error("Invalid wallet address");
  }

  if (!Number.isFinite(params.tokenAmount) || params.tokenAmount <= 0) {
    throw new Error("Invalid token amount");
  }

  const privateKey = process.env.ADMIN_PRIVATE_KEY || "";
  if (!privateKey) {
    throw new Error("Missing admin private key");
  }

  const provider = getProvider();
  const signer = new ethers.Wallet(privateKey, provider);
  const contract = getTokenContract(signer);
  const amount = ethers.parseUnits(params.tokenAmount.toString(), TOKEN_DECIMALS);
  const tx = await contract.mint(params.walletAddress, amount);
  const receipt = await tx.wait();

  return {
    hash: receipt?.hash || tx.hash,
    blockNumber: receipt?.blockNumber ?? null,
  };
}

