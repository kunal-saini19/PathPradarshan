"use client";

import { useEffect, useState } from "react";

type ChainTransaction = {
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

type WalletState = {
  userId: string;
  walletAddress: string | null;
  balance: number;
  contractAddress: string | null;
  transactions: ChainTransaction[];
};

export type BlockchainState = {
  walletAddress: string | null;
  balance: number;
  contractAddress: string | null;
  transactions: ChainTransaction[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  linkWalletAddress: (walletAddress: string) => Promise<boolean>;
  buyTokens: (amount: number) => Promise<void>;
};

export function useBlockchain(userId?: string | number, token?: string | null): BlockchainState {
  const [state, setState] = useState<WalletState>({
    userId: String(userId || ""),
    walletAddress: null,
    balance: 0,
    contractAddress: null,
    transactions: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    if (!userId) {
      setLoading(false);
      setState({ userId: "", walletAddress: null, balance: 0, contractAddress: null, transactions: [] });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/blockchain/wallet", {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const payload = (await response.json()) as { wallet?: WalletState; error?: string };

      if (!response.ok || !payload.wallet) {
        throw new Error(payload.error || "Unable to load wallet state");
      }

      setState(payload.wallet);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Unable to load wallet state");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, token]);

  async function linkWalletAddress(walletAddress: string) {
    if (!userId) {
      setError("Sign in to link a wallet address");
      return false;
    }

    setError(null);

    const response = await fetch("/api/users/wallet", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ walletAddress }),
    });

    const payload = (await response.json()) as { user?: unknown; error?: string };
    if (!response.ok) {
      const message = payload.error || "Unable to link wallet address";
      setError(message);
      return false;
    }

    await refresh();
    return true;
  }

  async function buyTokens(amount: number) {
    if (!userId) {
      setError("Sign in to buy tokens");
      return;
    }

    setError(null);

    try {
      const response = await fetch("/api/payment/razorpay/initiate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ amount }),
      });

      const payload = (await response.json()) as { paymentUrl?: string; error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Unable to initiate onramp");
      }

      if (!payload.paymentUrl) {
        throw new Error("Onramp did not return a payment URL");
      }

      globalThis.location.assign(payload.paymentUrl);
    } catch (buyError) {
      setError(buyError instanceof Error ? buyError.message : "Unable to start onramp");
    }
  }

  return {
    walletAddress: state.walletAddress,
    balance: state.balance,
    contractAddress: state.contractAddress,
    transactions: state.transactions,
    loading,
    error,
    refresh,
    linkWalletAddress,
    buyTokens,
  };
}
