"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { requireCurrentUserId } from "@/lib/auth/current-user";
import { currencies, wallets } from "@/lib/db";
import { withDatabaseUser } from "@/lib/db/with-user";
import { buildWalletIcon } from "@/lib/domain/icons";
import { parseDecimalToMinorUnits } from "@/lib/domain/money";
import { getNextWalletSortIndex, getWalletForUpdate } from "@/lib/wallets";

export async function createWallet(formData: FormData) {
  const userId = await requireCurrentUserId();
  const name = getRequiredString(formData, "name");
  const currencyId = getRequiredString(formData, "currency_id");
  const initialBalanceInput = getRequiredString(formData, "initial_balance");
  const countInTotal = isChecked(formData, "count_in_total");

  await withDatabaseUser(userId, async (tx) => {
    const [currency] = await tx
      .select({
        id: currencies.id,
        decimals: currencies.decimals,
      })
      .from(currencies)
      .where(and(eq(currencies.id, currencyId), eq(currencies.deleted, false)))
      .limit(1);

    if (!currency) {
      throw new Error("Currency not found.");
    }

    await tx.insert(wallets).values({
      userId,
      name,
      icon: buildWalletIcon(name),
      currencyId: currency.id,
      initialBalance: parseDecimalToMinorUnits(initialBalanceInput, currency.decimals),
      countInTotal,
      sortIndex: await getNextWalletSortIndex(tx),
    });
  });

  revalidatePath("/wallets");
}

export async function updateWallet(formData: FormData) {
  const userId = await requireCurrentUserId();
  const walletId = getRequiredString(formData, "wallet_id");
  const name = getRequiredString(formData, "name");
  const initialBalanceInput = getRequiredString(formData, "initial_balance");
  const countInTotal = isChecked(formData, "count_in_total");

  await withDatabaseUser(userId, async (tx) => {
    const wallet = await getWalletForUpdate(tx, walletId);

    await tx
      .update(wallets)
      .set({
        name,
        initialBalance: parseDecimalToMinorUnits(initialBalanceInput, wallet.currencyDecimals),
        countInTotal,
      })
      .where(eq(wallets.id, wallet.id));
  });

  revalidatePath("/wallets");
}

export async function archiveWallet(formData: FormData) {
  await setWalletArchived(formData, true);
}

export async function unarchiveWallet(formData: FormData) {
  await setWalletArchived(formData, false);
}

async function setWalletArchived(formData: FormData, archived: boolean) {
  const userId = await requireCurrentUserId();
  const walletId = getRequiredString(formData, "wallet_id");

  await withDatabaseUser(userId, async (tx) => {
    const wallet = await getWalletForUpdate(tx, walletId);

    await tx.update(wallets).set({ archived }).where(eq(wallets.id, wallet.id));
  });

  revalidatePath("/wallets");
}

function getRequiredString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Missing field: ${key}`);
  }

  return value.trim();
}

function isChecked(formData: FormData, key: string) {
  return formData.get(key) === "on";
}
