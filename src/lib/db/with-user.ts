import "server-only";

import { sql } from "drizzle-orm";

import { db } from "@/lib/db";

export type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function withDatabaseUser<T>(
  userId: string,
  callback: (tx: DbTransaction) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.current_user_id', ${userId}, true)`);

    return callback(tx);
  });
}
