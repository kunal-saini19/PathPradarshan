"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check, ArrowUpRight, ArrowDownRight, Coins, Link2, CreditCard, Activity } from "lucide-react";

import { DashboardLayout } from "@/components/DashboardLayout";
import { TokenStats } from "@/components/TokenStats";
import { useBlockchain } from "@/hooks/useBlockchain";
import { useAuth } from "@/context/AuthContext";

export default function WalletPage() {
  const { user, token } = useAuth();
  const blockchain = useBlockchain(user?.id, token);
  const [walletInput, setWalletInput] = useState(blockchain.walletAddress ?? "");
  const [buyAmount, setBuyAmount] = useState("100");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setWalletInput(blockchain.walletAddress ?? "");
  }, [blockchain.walletAddress]);

  const incoming = blockchain.transactions.filter((tx) => tx.type === "mint" || tx.type === "receive").reduce((sum, tx) => sum + Math.max(tx.amount, 0), 0);
  const outgoing = blockchain.transactions.filter((tx) => tx.type === "send").reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  async function handleSaveWalletAddress() {
    if (!walletInput.trim()) {
      return;
    }

    await blockchain.linkWalletAddress(walletInput.trim());
  }

  async function handleBuyTokens() {
    const amount = Number(buyAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return;
    }

    await blockchain.buyTokens(amount);
  }

  function copyAddress() {
    if (!blockchain.walletAddress) return;
    navigator.clipboard.writeText(blockchain.walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <DashboardLayout
      title="Wallet"
      subtitle="Link a real wallet address, read the ERC-20 balance from chain, and route fiat purchases through Razorpay."
    >
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        {/* Left: Account card */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden card-surface p-5"
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary-500 via-accent-500 to-primary-400" />
          <div className="pt-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-surface-400">Account</p>
            <h2 className="mt-2 font-heading text-xl font-semibold text-surface-900">{user?.username || "Not signed in"}</h2>
            <p className="mt-2 text-sm leading-relaxed text-surface-500">
              {user ? `Signed in as ${user.email || user.username}.` : "Sign in to link a wallet and buy tokens."}
            </p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            <span className="rounded-lg bg-primary-50 px-3 py-1 font-medium text-primary-700 ring-1 ring-primary-100">
              {user?.role || "Guest"}
            </span>
            <span className="rounded-lg bg-surface-50 px-3 py-1 font-medium text-surface-600 ring-1 ring-surface-200/80">
              ID: {user?.id || "n/a"}
            </span>
          </div>
        </motion.section>

        <div className="space-y-6">
          <TokenStats balance={blockchain.balance} earned={incoming} spent={outgoing} />

          {/* Wallet address */}
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card-surface space-y-4 p-5"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                <Link2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-heading text-lg font-semibold text-surface-900">Link wallet address</h2>
                <p className="mt-1 text-sm text-surface-500">
                  The address that receives minted tokens.
                </p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <input
                value={walletInput}
                onChange={(event) => setWalletInput(event.target.value)}
                placeholder="0x..."
                className="input"
              />
              <button type="button" onClick={handleSaveWalletAddress} className="btn-primary btn-md">
                Save address
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm">
              {blockchain.walletAddress ? (
                <div className="flex items-center gap-2 rounded-lg bg-surface-50 px-3 py-1.5 ring-1 ring-surface-200/80">
                  <span className="font-mono text-xs text-surface-600 truncate max-w-[200px]">
                    {blockchain.walletAddress}
                  </span>
                  <button
                    type="button"
                    onClick={copyAddress}
                    className="text-surface-400 hover:text-primary-600 transition-colors"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-success-600" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              ) : (
                <span className="rounded-lg bg-surface-50 px-3 py-1.5 text-xs text-surface-500 ring-1 ring-surface-200/80">
                  Not linked yet
                </span>
              )}
            </div>
          </motion.section>

          {/* Buy tokens */}
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card-surface space-y-4 p-5"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-50 text-accent-600">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-heading text-lg font-semibold text-surface-900">Buy tokens</h2>
                <p className="mt-1 text-sm text-surface-500">Route fiat payment through Razorpay</p>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <input
                value={buyAmount}
                onChange={(event) => setBuyAmount(event.target.value)}
                inputMode="numeric"
                placeholder="100"
                className="input"
              />
              <button type="button" onClick={handleBuyTokens} className="btn-primary btn-md">
                Continue to Razorpay
              </button>
            </div>
          </motion.section>

          {/* Chain state */}
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card-surface p-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <Activity className="h-4 w-4 text-surface-500" />
              <p className="font-heading text-sm font-semibold text-surface-900">Chain state</p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-lg bg-surface-50 px-3 py-1.5 font-medium text-surface-600 ring-1 ring-surface-200/80">
                Balance: {blockchain.balance} 2GT
              </span>
              <span className="rounded-lg bg-surface-50 px-3 py-1.5 font-medium text-surface-600 ring-1 ring-surface-200/80">
                Transactions: {blockchain.transactions.length}
              </span>
              <span className={`rounded-lg px-3 py-1.5 font-medium ring-1 ${
                blockchain.loading
                  ? "bg-warning-50 text-warning-700 ring-warning-100"
                  : "bg-success-50 text-success-700 ring-success-100"
              }`}>
                {blockchain.loading ? "Loading" : "Ready"}
              </span>
            </div>
            {blockchain.error ? (
              <p className="mt-3 rounded-xl border border-danger-100 bg-danger-50 px-4 py-3 text-sm text-danger-700">
                {blockchain.error}
              </p>
            ) : null}
          </motion.section>
        </div>
      </div>

      {/* Transaction history */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="mt-6 overflow-hidden rounded-2xl border border-surface-200/80 bg-white shadow-card-sm"
      >
        <div className="flex items-center justify-between gap-4 border-b border-surface-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-surface-500" />
            <h2 className="font-heading text-lg font-semibold text-surface-900">Transaction history</h2>
          </div>
          {blockchain.walletAddress ? (
            <span className="hidden rounded-lg bg-surface-50 px-3 py-1 text-xs font-mono text-surface-500 ring-1 ring-surface-200/80 sm:inline-block truncate max-w-[200px]">
              {blockchain.walletAddress}
            </span>
          ) : null}
        </div>

        <div className="divide-y divide-surface-100">
          {blockchain.transactions.map((tx) => (
            <div key={tx.id} className="flex flex-col gap-2 px-5 py-4 transition-colors hover:bg-surface-50/50 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                  tx.amount >= 0 ? "bg-success-50 text-success-600" : "bg-danger-50 text-danger-600"
                }`}>
                  {tx.amount >= 0 ? <ArrowDownRight className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-surface-900">{tx.label}</p>
                  <p className="text-xs text-surface-500">{new Date(tx.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <div className="text-right text-sm pl-12 md:pl-0">
                <p className={`font-heading font-semibold ${tx.amount >= 0 ? "text-success-600" : "text-danger-600"}`}>
                  {tx.amount >= 0 ? "+" : ""}{tx.amount} 2GT
                </p>
                <p className="text-xs text-surface-500">Balance: {tx.balanceAfter}</p>
              </div>
            </div>
          ))}
        </div>

        {blockchain.transactions.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-surface-500">
            No transactions yet.
          </div>
        ) : null}
      </motion.section>
    </DashboardLayout>
  );
}
