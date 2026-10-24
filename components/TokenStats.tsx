import { Wallet, TrendingUp, TrendingDown } from "lucide-react";

export function TokenStats({
  balance,
  earned,
  spent,
  label = "Wallet overview",
}: {
  balance: number;
  earned: number;
  spent: number;
  label?: string;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-surface-200/80 bg-white shadow-card-sm">
      <div className="border-b border-surface-100 px-5 py-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-surface-400">
          {label}
        </p>
      </div>
      <div className="grid grid-cols-3 divide-x divide-surface-100">
        <div className="p-4 text-center">
          <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-surface-50 text-surface-600">
            <Wallet className="h-4 w-4" />
          </div>
          <p className="text-xs text-surface-500">Balance</p>
          <p className="mt-0.5 font-heading text-xl font-bold text-surface-900">
            {balance.toLocaleString()}
          </p>
        </div>
        <div className="p-4 text-center">
          <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-success-50 text-success-600">
            <TrendingUp className="h-4 w-4" />
          </div>
          <p className="text-xs text-success-600">Earned</p>
          <p className="mt-0.5 font-heading text-xl font-bold text-success-700">
            +{earned.toLocaleString()}
          </p>
        </div>
        <div className="p-4 text-center">
          <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-danger-50 text-danger-600">
            <TrendingDown className="h-4 w-4" />
          </div>
          <p className="text-xs text-danger-600">Spent</p>
          <p className="mt-0.5 font-heading text-xl font-bold text-danger-700">
            -{spent.toLocaleString()}
          </p>
        </div>
      </div>
    </section>
  );
}
