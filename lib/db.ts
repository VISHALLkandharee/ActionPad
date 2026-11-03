import { Pool } from "pg";

// In dev, hot reload re-runs this file. Saving the pool on globalThis
// stops us from opening a new set of connections every time.
const globalForPg = globalThis as unknown as { pgPool?: Pool };

export const pool =
  globalForPg.pgPool ??
  new Pool({ connectionString: process.env.DATABASE_URL });

if (process.env.NODE_ENV !== "production") {
  globalForPg.pgPool = pool;
}