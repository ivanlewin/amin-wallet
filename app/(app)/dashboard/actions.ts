"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { requireCurrentUserId, syncCurrentUser } from "@/lib/auth/current-user";
import { categories, currencies, db, transactions, transfers, wallets } from "@/lib/db";
import { buildColorIcon, buildWalletIcon } from "@/lib/domain/icons";
import { parseDecimalToMinorUnits } from "@/lib/domain/money";

export async function createWallet(formData: FormData) {
  const user = await syncCurrentUser();
  const name = getRequiredString(formData, "name");
  const currencyId = getRequiredString(formData, "currency_id");
  const initialBalanceInput = getRequiredString(formData, "initial_balance");
  const currency = await db.query.currencies.findFirst({
    where: and(eq(currencies.id, currencyId), eq(currencies.isDeleted, false)),
  });

  if (!currency) {
    throw new Error("Currency not found.");
  }

  const initialBalance = parseDecimalToMinorUnits(initialBalanceInput, currency.decimals);
  const sortIndex = await getNextWalletIndex(user.id);

  await db.insert(wallets).values({
    userId: user.id,
    name,
    icon: buildWalletIcon(name),
    currencyId: currency.id,
    initialBalance,
    sortIndex,
  });

  revalidatePath("/dashboard");
}

export async function createCategory(formData: FormData) {
  const userId = await requireCurrentUserId();
  const name = getRequiredString(formData, "name");
  const type = getRequiredString(formData, "type");
  const color = getOptionalString(formData, "color") ?? "#2563eb";
  const includeInReports = isChecked(formData, "include_in_reports");
  const sortIndex = await getNextCategoryIndex(userId);

  if (type !== "income" && type !== "expense") {
    throw new Error("Choose a valid category type.");
  }

  await db.insert(categories).values({
    userId,
    name,
    icon: buildColorIcon(name, color),
    type,
    includeInReports,
    sortIndex,
  });

  revalidatePath("/dashboard");
}

export async function createTransaction(formData: FormData) {
  const userId = await requireCurrentUserId();
  const walletId = getRequiredString(formData, "wallet_id");
  const categoryId = getRequiredString(formData, "category_id");
  const amountInput = getRequiredString(formData, "amount");
  const dateInput = getRequiredString(formData, "date");
  const wallet = await getOwnedWallet(userId, walletId);
  const category = await db.query.categories.findFirst({
    where: and(
      eq(categories.id, categoryId),
      eq(categories.userId, userId),
      eq(categories.isDeleted, false),
    ),
  });

  if (!category) {
    throw new Error("Category not found.");
  }

  const amount = parseDecimalToMinorUnits(amountInput, wallet.currencyDecimals);

  await db.insert(transactions).values({
    walletId: wallet.id,
    categoryId: category.id,
    amount,
    date: parseDate(dateInput),
    description: getOptionalString(formData, "description"),
    note: getOptionalString(formData, "note"),
    isConfirmed: isChecked(formData, "is_confirmed"),
    includeInTotal: isChecked(formData, "include_in_total"),
  });

  revalidatePath("/dashboard");
}

export async function createTransfer(formData: FormData) {
  const userId = await requireCurrentUserId();
  const fromWalletId = getRequiredString(formData, "from_wallet_id");
  const toWalletId = getRequiredString(formData, "to_wallet_id");
  const fromAmountInput = getRequiredString(formData, "from_amount");
  const toAmountInput = getRequiredString(formData, "to_amount");
  const feeAmountInput = getOptionalString(formData, "fee_amount") ?? "0";
  const dateInput = getRequiredString(formData, "date");

  if (fromWalletId === toWalletId) {
    throw new Error("Choose two different wallets.");
  }

  const [fromWallet, toWallet] = await Promise.all([
    getOwnedWallet(userId, fromWalletId),
    getOwnedWallet(userId, toWalletId),
  ]);

  await db.insert(transfers).values({
    fromWalletId: fromWallet.id,
    toWalletId: toWallet.id,
    fromAmount: parseDecimalToMinorUnits(fromAmountInput, fromWallet.currencyDecimals),
    toAmount: parseDecimalToMinorUnits(toAmountInput, toWallet.currencyDecimals),
    feeAmount: parseDecimalToMinorUnits(feeAmountInput, fromWallet.currencyDecimals),
    date: parseDate(dateInput),
    description: getOptionalString(formData, "description"),
    note: getOptionalString(formData, "note"),
    isConfirmed: isChecked(formData, "is_confirmed"),
    includeInTotal: isChecked(formData, "include_in_total"),
  });

  revalidatePath("/dashboard");
}

async function getOwnedWallet(userId: string, walletId: string) {
  const [wallet] = await db
    .select({
      id: wallets.id,
      currencyId: wallets.currencyId,
      currencyDecimals: currencies.decimals,
    })
    .from(wallets)
    .innerJoin(currencies, eq(wallets.currencyId, currencies.id))
    .where(and(eq(wallets.id, walletId), eq(wallets.userId, userId), eq(wallets.isDeleted, false)))
    .limit(1);

  if (!wallet) {
    throw new Error("Wallet not found.");
  }

  return wallet;
}

async function getNextWalletIndex(userId: string) {
  const [result] = await db
    .select({
      value: sql<number>`coalesce(max(${wallets.sortIndex}), -1)`,
    })
    .from(wallets)
    .where(eq(wallets.userId, userId));

  return (result?.value ?? -1) + 1;
}

async function getNextCategoryIndex(userId: string) {
  const [result] = await db
    .select({
      value: sql<number>`coalesce(max(${categories.sortIndex}), -1)`,
    })
    .from(categories)
    .where(eq(categories.userId, userId));

  return (result?.value ?? -1) + 1;
}

function getRequiredString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Missing field: ${key}`);
  }

  return value.trim();
}

function getOptionalString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function isChecked(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function parseDate(value: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.valueOf())) {
    throw new Error("Enter a valid date.");
  }

  return parsed;
}
