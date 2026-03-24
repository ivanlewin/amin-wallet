import "server-only";

import { asc, eq } from "drizzle-orm";
import { cacheLife } from "next/cache";

import { currencies, db } from "@/lib/db";

export async function getCurrencies() {
  "use cache";

  cacheLife("hours");

  return db
    .select({
      id: currencies.id,
      code: currencies.code,
      name: currencies.name,
      symbol: currencies.symbol,
      decimals: currencies.decimals,
    })
    .from(currencies)
    .where(eq(currencies.isDeleted, false))
    .orderBy(asc(currencies.code));
}

