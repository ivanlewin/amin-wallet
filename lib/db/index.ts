import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "@/lib/db/schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

function createSqlClient(url: string) {
  return postgres(url, {
    max: 1,
    prepare: false,
  });
}

function createDb(client: ReturnType<typeof postgres>) {
  return drizzle(client, { schema });
}

type AminWalletDb = ReturnType<typeof createDb>;

declare global {
  // eslint-disable-next-line no-var
  var __aminWalletSql: ReturnType<typeof postgres> | undefined;
  // eslint-disable-next-line no-var
  var __aminWalletDb: AminWalletDb | undefined;
}

const sqlClient = globalThis.__aminWalletSql ?? createSqlClient(connectionString);

export const db = globalThis.__aminWalletDb ?? createDb(sqlClient);

if (process.env.NODE_ENV !== "production") {
  globalThis.__aminWalletSql = sqlClient;
  globalThis.__aminWalletDb = db;
}

export { sqlClient };
export * from "@/lib/db/schema";
