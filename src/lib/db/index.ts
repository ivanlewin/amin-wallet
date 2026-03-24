import dotenv from "dotenv";

dotenv.config({
  path: ".env.development.local",
});

import { drizzle } from "drizzle-orm/node-postgres";

export const db = drizzle(process.env.DATABASE_URL!);

export * from "@/lib/db/schema";
