import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { Suspense } from "react";
import { connection } from "next/server";

import { createCategory, createTransaction, createTransfer, createWallet } from "@/app/(app)/dashboard/actions";
import { getDashboardData } from "@/lib/dashboard";
import { formatMinorUnits } from "@/lib/domain/money";

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <DashboardContent />
    </Suspense>
  );
}

async function DashboardContent() {
  await connection();

  const data = await getDashboardData();
  const hasWallets = data.wallets.length > 0;
  const hasCategories = data.categories.length > 0;
  const defaultDate = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-8 py-2">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-[1.75rem] border border-white/10 bg-white/5 px-5 py-4 backdrop-blur">
        <div className="space-y-1">
          <Link href="/dashboard" className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-300">
            Amin Wallet
          </Link>
          <p className="text-sm text-slate-400">
            Signed in as <span className="font-medium text-white">{data.user.firstName ?? data.user.email}</span>
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm text-slate-300 transition hover:text-white">
            Public landing
          </Link>
          <UserButton />
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/6 p-6 shadow-2xl shadow-black/10">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-300">Dashboard</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">Welcome back, {data.user.firstName ?? "there"}.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
            The app is now backed by Clerk-owned users, Drizzle migrations, and PlanetScale Postgres. Everything on
            this screen is rendered on the server and scoped through your wallet ownership.
          </p>
        </div>
        <div className="rounded-[2rem] border border-emerald-400/20 bg-emerald-400/10 p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300">Foundation status</p>
          <ul className="mt-4 space-y-3 text-sm text-slate-200">
            <li>{data.wallets.length} wallets ready for authenticated queries.</li>
            <li>{data.categories.length} categories available, including seeded system categories.</li>
            <li>{data.transactions.length} recent transactions loaded through wallet ownership joins.</li>
            <li>{data.transfers.length} recent transfers persisted with direct amount columns.</li>
          </ul>
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-8">
          <Panel
            title="Create wallet"
            description="Wallet ownership is direct: each wallet belongs to the current Clerk-backed user."
          >
            <form action={createWallet} className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 sm:col-span-2">
                <span className="text-sm font-medium text-slate-200">Wallet name</span>
                <input name="name" required className={inputClassName} placeholder="Cash wallet" />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-200">Currency</span>
                <select name="currency_id" required className={inputClassName}>
                  {data.currencies.map((currency) => (
                    <option key={currency.id} value={currency.id}>
                      {currency.code} · {currency.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-200">Initial balance</span>
                <input name="initial_balance" required className={inputClassName} placeholder="0.00" />
              </label>
              <div className="sm:col-span-2">
                <button type="submit" className={primaryButtonClassName}>
                  Save wallet
                </button>
              </div>
            </form>
          </Panel>

          <Panel title="Create category" description="Categories are user-owned and seeded with one-level system defaults.">
            <form action={createCategory} className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 sm:col-span-2">
                <span className="text-sm font-medium text-slate-200">Category name</span>
                <input name="name" required className={inputClassName} placeholder="Groceries" />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-200">Type</span>
                <select name="type" required className={inputClassName}>
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-200">Color</span>
                <input name="color" type="color" defaultValue="#2563eb" className={`${inputClassName} h-11`} />
              </label>
              <label className="flex items-center gap-3 sm:col-span-2">
                <input name="include_in_reports" type="checkbox" defaultChecked className="h-4 w-4 accent-sky-500" />
                <span className="text-sm text-slate-300">Include this category in reports</span>
              </label>
              <div className="sm:col-span-2">
                <button type="submit" className={primaryButtonClassName}>
                  Save category
                </button>
              </div>
            </form>
          </Panel>

          <Panel title="Create transaction" description="Transaction access is enforced through the selected wallet owner.">
            {hasWallets && hasCategories ? (
              <form action={createTransaction} className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-200">Wallet</span>
                  <select name="wallet_id" required className={inputClassName}>
                    {data.wallets.map((wallet) => (
                      <option key={wallet.id} value={wallet.id}>
                        {wallet.name} · {wallet.currencyCode}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-200">Category</span>
                  <select name="category_id" required className={inputClassName}>
                    {data.categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name} · {category.type}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-200">Amount</span>
                  <input name="amount" required className={inputClassName} placeholder="42.50" />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-200">Date</span>
                  <input name="date" type="date" required defaultValue={defaultDate} className={inputClassName} />
                </label>
                <label className="space-y-2 sm:col-span-2">
                  <span className="text-sm font-medium text-slate-200">Description</span>
                  <input name="description" className={inputClassName} placeholder="Market run" />
                </label>
                <label className="space-y-2 sm:col-span-2">
                  <span className="text-sm font-medium text-slate-200">Note</span>
                  <textarea name="note" className={`${inputClassName} min-h-24`} placeholder="Optional note" />
                </label>
                <div className="flex flex-wrap gap-4 sm:col-span-2">
                  <label className="flex items-center gap-3">
                    <input name="is_confirmed" type="checkbox" defaultChecked className="h-4 w-4 accent-sky-500" />
                    <span className="text-sm text-slate-300">Confirmed</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input name="include_in_total" type="checkbox" defaultChecked className="h-4 w-4 accent-sky-500" />
                    <span className="text-sm text-slate-300">Include in totals</span>
                  </label>
                </div>
                <div className="sm:col-span-2">
                  <button type="submit" className={primaryButtonClassName}>
                    Save transaction
                  </button>
                </div>
              </form>
            ) : (
              <EmptyState copy="Create at least one wallet and one category before adding transactions." />
            )}
          </Panel>

          <Panel title="Create transfer" description="Transfers now persist source, target, and fee amounts directly.">
            {data.wallets.length >= 2 ? (
              <form action={createTransfer} className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-200">From wallet</span>
                  <select name="from_wallet_id" required className={inputClassName}>
                    {data.wallets.map((wallet) => (
                      <option key={wallet.id} value={wallet.id}>
                        {wallet.name} · {wallet.currencyCode}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-200">To wallet</span>
                  <select name="to_wallet_id" required className={inputClassName}>
                    {data.wallets.map((wallet) => (
                      <option key={wallet.id} value={wallet.id}>
                        {wallet.name} · {wallet.currencyCode}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-200">From amount</span>
                  <input name="from_amount" required className={inputClassName} placeholder="100.00" />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-200">To amount</span>
                  <input name="to_amount" required className={inputClassName} placeholder="100.00" />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-200">Fee amount</span>
                  <input name="fee_amount" className={inputClassName} placeholder="0.00" />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-200">Date</span>
                  <input name="date" type="date" required defaultValue={defaultDate} className={inputClassName} />
                </label>
                <label className="space-y-2 sm:col-span-2">
                  <span className="text-sm font-medium text-slate-200">Description</span>
                  <input name="description" className={inputClassName} placeholder="Broker transfer" />
                </label>
                <label className="space-y-2 sm:col-span-2">
                  <span className="text-sm font-medium text-slate-200">Note</span>
                  <textarea name="note" className={`${inputClassName} min-h-24`} placeholder="Optional note" />
                </label>
                <div className="flex flex-wrap gap-4 sm:col-span-2">
                  <label className="flex items-center gap-3">
                    <input name="is_confirmed" type="checkbox" defaultChecked className="h-4 w-4 accent-sky-500" />
                    <span className="text-sm text-slate-300">Confirmed</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input name="include_in_total" type="checkbox" defaultChecked className="h-4 w-4 accent-sky-500" />
                    <span className="text-sm text-slate-300">Include in totals</span>
                  </label>
                </div>
                <div className="sm:col-span-2">
                  <button type="submit" className={primaryButtonClassName}>
                    Save transfer
                  </button>
                </div>
              </form>
            ) : (
              <EmptyState copy="Create two wallets before adding transfers." />
            )}
          </Panel>
        </div>

        <div className="space-y-8">
          <Panel title="Wallets" description="Current wallets joined with their reference currencies.">
            {hasWallets ? (
              <ul className="space-y-3">
                {data.wallets.map((wallet) => (
                  <li key={wallet.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-white">{wallet.name}</p>
                        <p className="text-sm text-slate-400">
                          {wallet.currencyCode} · {wallet.isArchived ? "Archived" : "Active"}
                        </p>
                      </div>
                      <p className="text-right text-sm text-slate-200">
                        {formatMinorUnits(wallet.initialBalance, wallet.currencyCode, wallet.currencyDecimals)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState copy="No wallets yet. Create the first one to unlock the rest of the ledger flows." />
            )}
          </Panel>

          <Panel title="Categories" description="System categories are created automatically on first sign-in.">
            <ul className="space-y-3">
              {data.categories.map((category) => (
                <li key={category.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div>
                    <p className="font-semibold text-white">{category.name}</p>
                    <p className="text-sm text-slate-400">
                      {category.type}
                      {category.tag ? ` · ${category.tag}` : ""}
                    </p>
                  </div>
                  <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    {category.includeInReports ? "Reports" : "Hidden"}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Recent transactions" description="Read path goes through wallet ownership plus category joins.">
            {data.transactions.length ? (
              <ul className="space-y-3">
                {data.transactions.map((transaction) => (
                  <li key={transaction.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-white">{transaction.description ?? transaction.categoryName}</p>
                        <p className="text-sm text-slate-400">
                          {transaction.walletName} · {transaction.categoryName} · {transaction.date.toISOString().slice(0, 10)}
                        </p>
                        {transaction.note ? <p className="mt-2 text-sm text-slate-500">{transaction.note}</p> : null}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-white">
                          {formatMinorUnits(transaction.amount, transaction.currencyCode, transaction.currencyDecimals)}
                        </p>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                          {transaction.isConfirmed ? "Confirmed" : "Pending"}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState copy="No transactions yet. The create form on the left will write directly through Drizzle." />
            )}
          </Panel>

          <Panel title="Recent transfers" description="Transfers are stored with explicit source, destination, and fee amounts.">
            {data.transfers.length ? (
              <ul className="space-y-3">
                {data.transfers.map((transfer) => (
                  <li key={transfer.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold text-white">{transfer.description ?? "Wallet transfer"}</p>
                          <p className="text-sm text-slate-400">
                            {transfer.fromWallet?.name ?? "Unknown"} → {transfer.toWallet?.name ?? "Unknown"} ·{" "}
                            {transfer.date.toISOString().slice(0, 10)}
                          </p>
                          {transfer.note ? <p className="mt-2 text-sm text-slate-500">{transfer.note}</p> : null}
                        </div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                          {transfer.isConfirmed ? "Confirmed" : "Pending"}
                        </p>
                      </div>
                      <div className="grid gap-2 rounded-2xl border border-white/10 bg-slate-950/60 p-3 text-sm text-slate-300 sm:grid-cols-3">
                        <p>
                          From:{" "}
                          <span className="font-semibold text-white">
                            {transfer.fromWallet
                              ? formatMinorUnits(
                                  transfer.fromAmount,
                                  transfer.fromWallet.currencyCode,
                                  transfer.fromWallet.currencyDecimals,
                                )
                              : transfer.fromAmount.toString()}
                          </span>
                        </p>
                        <p>
                          To:{" "}
                          <span className="font-semibold text-white">
                            {transfer.toWallet
                              ? formatMinorUnits(
                                  transfer.toAmount,
                                  transfer.toWallet.currencyCode,
                                  transfer.toWallet.currencyDecimals,
                                )
                              : transfer.toAmount.toString()}
                          </span>
                        </p>
                        <p>
                          Fee:{" "}
                          <span className="font-semibold text-white">
                            {transfer.fromWallet
                              ? formatMinorUnits(
                                  transfer.feeAmount,
                                  transfer.fromWallet.currencyCode,
                                  transfer.fromWallet.currencyDecimals,
                                )
                              : transfer.feeAmount.toString()}
                          </span>
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState copy="No transfers yet. Once you have two wallets, you can test the modernized transfer model." />
            )}
          </Panel>
        </div>
      </section>
    </div>
  );
}

function DashboardFallback() {
  return (
    <div className="space-y-8 py-2">
      <div className="rounded-[1.75rem] border border-white/10 bg-white/5 px-5 py-4">
        <div className="h-4 w-28 animate-pulse rounded bg-white/10" />
        <div className="mt-3 h-8 w-64 animate-pulse rounded bg-white/10" />
      </div>
      <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-8">
          <div className="h-72 animate-pulse rounded-[2rem] border border-white/10 bg-white/6" />
          <div className="h-72 animate-pulse rounded-[2rem] border border-white/10 bg-white/6" />
        </div>
        <div className="space-y-8">
          <div className="h-72 animate-pulse rounded-[2rem] border border-white/10 bg-white/6" />
          <div className="h-72 animate-pulse rounded-[2rem] border border-white/10 bg-white/6" />
        </div>
      </div>
    </div>
  );
}

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/6 p-6">
      <div className="mb-5 space-y-1">
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        <p className="text-sm leading-6 text-slate-400">{description}</p>
      </div>
      {children}
    </section>
  );
}

function EmptyState({ copy }: { copy: string }) {
  return <p className="rounded-2xl border border-dashed border-white/15 bg-slate-950/60 p-4 text-sm text-slate-400">{copy}</p>;
}

const inputClassName =
  "w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400";

const primaryButtonClassName =
  "rounded-full bg-sky-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400";

