import dotenv from "dotenv";

dotenv.config({
  path: ".env.development.local",
  quiet: true,
});

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "@/lib/db/schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set.");
}

function createPool(url: string) {
  return new Pool({
    connectionString: url,
    max: 10,
  });
}

function createDb(client: Pool) {
  return drizzle(client, { schema });
}

type AminWalletDb = ReturnType<typeof createDb>;

declare global {
  // eslint-disable-next-line no-var
  var __aminWalletPool: Pool | undefined;
  // eslint-disable-next-line no-var
  var __aminWalletDb: AminWalletDb | undefined;
}

const pool = globalThis.__aminWalletPool ?? createPool(connectionString);

export const db = globalThis.__aminWalletDb ?? createDb(pool);

if (process.env.NODE_ENV !== "production") {
  globalThis.__aminWalletPool = pool;
  globalThis.__aminWalletDb = db;
}

export { pool };
export * from "@/lib/db/schema";
