import "server-only";

import { and, asc, desc, eq } from "drizzle-orm";
import { cache } from "react";

import { syncCurrentUser } from "@/lib/auth/current-user";
import { categories, currencies, db, transactions, transfers, wallets } from "@/lib/db";
import { getCurrencies } from "@/lib/db/reference";

export const getDashboardData = cache(async () => {
  const user = await syncCurrentUser();

  const [currencyOptions, walletRows, categoryRows, transactionRows, transferRows] = await Promise.all([
    getCurrencies(),
    db
      .select({
        id: wallets.id,
        name: wallets.name,
        initialBalance: wallets.initialBalance,
        sortIndex: wallets.sortIndex,
        currencyId: wallets.currencyId,
        currencyCode: currencies.code,
        currencySymbol: currencies.symbol,
        currencyDecimals: currencies.decimals,
        isArchived: wallets.isArchived,
      })
      .from(wallets)
      .innerJoin(currencies, eq(wallets.currencyId, currencies.id))
      .where(and(eq(wallets.userId, user.id), eq(wallets.isDeleted, false)))
      .orderBy(asc(wallets.sortIndex), asc(wallets.name)),
    db
      .select({
        id: categories.id,
        name: categories.name,
        type: categories.type,
        tag: categories.tag,
        sortIndex: categories.sortIndex,
        includeInReports: categories.includeInReports,
      })
      .from(categories)
      .where(and(eq(categories.userId, user.id), eq(categories.isDeleted, false)))
      .orderBy(asc(categories.sortIndex), asc(categories.name)),
    db
      .select({
        id: transactions.id,
        amount: transactions.amount,
        date: transactions.date,
        description: transactions.description,
        note: transactions.note,
        isConfirmed: transactions.isConfirmed,
        includeInTotal: transactions.includeInTotal,
        walletName: wallets.name,
        categoryName: categories.name,
        categoryType: categories.type,
        currencyCode: currencies.code,
        currencyDecimals: currencies.decimals,
      })
      .from(transactions)
      .innerJoin(wallets, eq(transactions.walletId, wallets.id))
      .innerJoin(currencies, eq(wallets.currencyId, currencies.id))
      .innerJoin(categories, eq(transactions.categoryId, categories.id))
      .where(and(eq(wallets.userId, user.id), eq(transactions.isDeleted, false)))
      .orderBy(desc(transactions.date), desc(transactions.createdAt))
      .limit(10),
    db
      .select({
        id: transfers.id,
        description: transfers.description,
        date: transfers.date,
        note: transfers.note,
        fromWalletId: transfers.fromWalletId,
        toWalletId: transfers.toWalletId,
        fromAmount: transfers.fromAmount,
        toAmount: transfers.toAmount,
        feeAmount: transfers.feeAmount,
        isConfirmed: transfers.isConfirmed,
        includeInTotal: transfers.includeInTotal,
      })
      .from(transfers)
      .innerJoin(wallets, eq(transfers.fromWalletId, wallets.id))
      .where(and(eq(wallets.userId, user.id), eq(transfers.isDeleted, false)))
      .orderBy(desc(transfers.date), desc(transfers.createdAt))
      .limit(10),
  ]);

  const walletMap = new Map(walletRows.map((wallet) => [wallet.id, wallet]));

  return {
    user,
    currencies: currencyOptions,
    wallets: walletRows,
    categories: categoryRows,
    transactions: transactionRows,
    transfers: transferRows.map((transfer) => ({
      ...transfer,
      fromWallet: walletMap.get(transfer.fromWalletId) ?? null,
      toWallet: walletMap.get(transfer.toWalletId) ?? null,
    })),
  };
});

