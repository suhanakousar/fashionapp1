import "dotenv/config";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Detect if using local PostgreSQL or Neon (cloud)
const isLocalDatabase = process.env.DATABASE_URL.includes('localhost') || 
                        process.env.DATABASE_URL.includes('127.0.0.1');

let pool: any;
let db: any;

if (isLocalDatabase) {
  // Use standard pg for local PostgreSQL
  const pgModule = await import('pg');
  const { drizzle: drizzlePg } = await import('drizzle-orm/node-postgres');
  const PgPool = pgModule.default?.Pool || pgModule.Pool;
  pool = new PgPool({ connectionString: process.env.DATABASE_URL });
  db = drizzlePg(pool, { schema });
} else {
  // Use Neon serverless for cloud databases
  const neon = await import('@neondatabase/serverless');
  const { drizzle: drizzleNeon } = await import('drizzle-orm/neon-serverless');
  const ws = await import("ws");
  neon.neonConfig.webSocketConstructor = ws.default;
  pool = new neon.Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzleNeon(pool, { schema });
}

export { pool, db };
