import { ArchiveIcon, CircleDollarSignIcon, WalletIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatMinorUnits, formatMinorUnitsForInput } from "@/lib/domain/money";
import { getWalletPageData, type WalletRecord } from "@/lib/wallets";

import { archiveWallet, createWallet, unarchiveWallet, updateWallet } from "./actions";

export default async function WalletsPage() {
  const data = await getWalletPageData();

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">First slice</p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Wallets</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Create wallets, adjust their balances, and archive the ones you no longer want in the
          active workspace. Currency stays locked after creation so historical amounts keep the
          meaning they were created with.
        </p>
      </section>

      <div className="grid gap-6 xl:grid-cols-[22rem_minmax(0,1fr)]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Create wallet</CardTitle>
            <CardDescription>
              The icon is handled internally for now, so the only choices here are the financial
              fields that matter.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createWallet} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="wallet-name">Name</Label>
                <Input id="wallet-name" name="name" placeholder="Cash" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="wallet-currency">Currency</Label>
                <select
                  id="wallet-currency"
                  name="currency_id"
                  className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  required
                >
                  {data.currencies.map((currency) => (
                    <option key={currency.id} value={currency.id}>
                      {currency.code} · {currency.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="wallet-balance">Initial balance</Label>
                <Input
                  id="wallet-balance"
                  name="initial_balance"
                  inputMode="decimal"
                  placeholder="0.00"
                  required
                />
              </div>

              <label className="flex items-center gap-3 rounded-lg border border-border/70 bg-muted/30 px-3 py-2 text-sm">
                <input
                  name="count_in_total"
                  type="checkbox"
                  defaultChecked
                  className="size-4 rounded border border-input accent-foreground"
                />
                <span className="text-sm text-foreground">Count this wallet in total balances</span>
              </label>

              <Button type="submit" className="w-full">
                Save wallet
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <WalletSection
            title="Active wallets"
            description="Your working set. These wallets stay visible in the day-to-day app flow."
            emptyCopy="No wallets yet. Create the first one to establish the structure of the app."
            wallets={data.activeWallets}
            archiveAction={archiveWallet}
          />
          <WalletSection
            title="Archived wallets"
            description="Hidden from the active set, but still editable and restorable."
            emptyCopy="No archived wallets yet."
            wallets={data.archivedWallets}
            archiveAction={unarchiveWallet}
          />
        </div>
      </div>
    </div>
  );
}

function WalletSection({
  title,
  description,
  emptyCopy,
  wallets,
  archiveAction,
}: {
  title: string;
  description: string;
  emptyCopy: string;
  wallets: WalletRecord[];
  archiveAction: (formData: FormData) => Promise<void>;
}) {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      {wallets.length ? (
        <div className="grid gap-4">
          {wallets.map((wallet) => (
            <WalletCard key={wallet.id} wallet={wallet} archiveAction={archiveAction} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">{emptyCopy}</p>
          </CardContent>
        </Card>
      )}
    </section>
  );
}

function WalletCard({
  wallet,
  archiveAction,
}: {
  wallet: WalletRecord;
  archiveAction: (formData: FormData) => Promise<void>;
}) {
  const formId = `wallet-form-${wallet.id}`;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <WalletIcon className="size-4" />
            </div>
            <div className="min-w-0">
              <CardTitle className="truncate">{wallet.name}</CardTitle>
              <CardDescription>
                {wallet.currencyCode} · {wallet.currencyName}
              </CardDescription>
            </div>
          </div>

          <div className="rounded-lg border border-border/70 bg-muted/30 px-3 py-2 text-right">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Balance
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {formatMinorUnits(
                wallet.initialBalance,
                wallet.currencyCode,
                wallet.currencyDecimals,
              )}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <form id={formId} action={updateWallet} className="grid gap-4 md:grid-cols-2">
          <input type="hidden" name="wallet_id" value={wallet.id} />

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor={`${wallet.id}-name`}>Name</Label>
            <Input id={`${wallet.id}-name`} name="name" defaultValue={wallet.name} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${wallet.id}-currency`}>Currency</Label>
            <Input
              id={`${wallet.id}-currency`}
              value={`${wallet.currencyCode} · ${wallet.currencyName}`}
              readOnly
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${wallet.id}-balance`}>Initial balance</Label>
            <Input
              id={`${wallet.id}-balance`}
              name="initial_balance"
              defaultValue={formatMinorUnitsForInput(
                wallet.initialBalance,
                wallet.currencyDecimals,
              )}
              inputMode="decimal"
              required
            />
          </div>

          <label className="flex items-center gap-3 rounded-lg border border-border/70 bg-muted/30 px-3 py-2 text-sm md:col-span-2">
            <input
              name="count_in_total"
              type="checkbox"
              defaultChecked={wallet.countInTotal}
              className="size-4 rounded border border-input accent-foreground"
            />
            <span className="text-sm text-foreground">Count this wallet in total balances</span>
          </label>
        </form>
      </CardContent>

      <CardFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
          <CircleDollarSignIcon className="size-4" />
          <span>{wallet.archived ? "Archived wallet" : "Active wallet"}</span>
        </div>

        <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
          <form action={archiveAction}>
            <input type="hidden" name="wallet_id" value={wallet.id} />
            <Button variant="outline" type="submit">
              <ArchiveIcon />
              {wallet.archived ? "Unarchive" : "Archive"}
            </Button>
          </form>
          <Button type="submit" form={formId}>
            Save changes
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
