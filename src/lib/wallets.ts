import "server-only";

import { asc, eq, sql } from "drizzle-orm";

import { getCurrentUserRecord } from "@/lib/auth/current-user";
import { currencies, wallets } from "@/lib/db";
import { withDatabaseUser, type DbTransaction } from "@/lib/db/with-user";

export type WalletRecord = {
  id: string;
  name: string;
  initialBalance: bigint;
  countInTotal: boolean;
  archived: boolean;
  sortIndex: number;
  currencyId: string;
  currencyCode: string;
  currencyName: string;
  currencySymbol: string;
  currencyDecimals: number;
};

export async function getWalletPageData() {
  const user = await getCurrentUserRecord();

  const data = await withDatabaseUser(user.id, async (tx) => {
    const [currencyRows, walletRows] = await Promise.all([
      tx
        .select({
          id: currencies.id,
          code: currencies.code,
          name: currencies.name,
          symbol: currencies.symbol,
          decimals: currencies.decimals,
        })
        .from(currencies)
        .where(eq(currencies.deleted, false))
        .orderBy(asc(currencies.code)),
      tx
        .select({
          id: wallets.id,
          name: wallets.name,
          initialBalance: wallets.initialBalance,
          countInTotal: wallets.countInTotal,
          archived: wallets.archived,
          sortIndex: wallets.sortIndex,
          currencyId: wallets.currencyId,
          currencyCode: currencies.code,
          currencyName: currencies.name,
          currencySymbol: currencies.symbol,
          currencyDecimals: currencies.decimals,
        })
        .from(wallets)
        .innerJoin(currencies, eq(wallets.currencyId, currencies.id))
        .orderBy(asc(wallets.archived), asc(wallets.sortIndex), asc(wallets.name)),
    ]);

    return {
      currencies: currencyRows,
      wallets: walletRows,
    };
  });

  return {
    user,
    currencies: data.currencies,
    activeWallets: data.wallets.filter((wallet) => !wallet.archived),
    archivedWallets: data.wallets.filter((wallet) => wallet.archived),
  };
}

export async function getWalletForUpdate(tx: DbTransaction, walletId: string) {
  const [wallet] = await tx
    .select({
      id: wallets.id,
      currencyId: wallets.currencyId,
      currencyCode: currencies.code,
      currencyDecimals: currencies.decimals,
    })
    .from(wallets)
    .innerJoin(currencies, eq(wallets.currencyId, currencies.id))
    .where(eq(wallets.id, walletId))
    .limit(1);

  if (!wallet) {
    throw new Error("Wallet not found.");
  }

  return wallet;
}

export async function getNextWalletSortIndex(tx: DbTransaction) {
  const [result] = await tx
    .select({
      value: sql<number>`coalesce(max(${wallets.sortIndex}), -1)`,
    })
    .from(wallets);

  return (result?.value ?? -1) + 1;
}
