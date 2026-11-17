import "dotenv/config";
import { Pool } from "pg";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing from .env");
}

// Detect Neon: check for neon.tech or pooler in URL
const databaseUrl = process.env.DATABASE_URL;
const isNeon = databaseUrl.includes("neon.tech") || databaseUrl.includes("-pooler.");

// Neon uses pgbouncer for pooling - use pooled connection for app, direct for migrations
// The pooled connection string has "-pooler" in the hostname
export const pool = new Pool({
  connectionString: databaseUrl,
  max: isNeon ? 20 : 10, // Neon supports more connections via pgbouncer
  idleTimeoutMillis: isNeon ? 10000 : 30000, // Shorter idle timeout for serverless
  connectionTimeoutMillis: 10000,
  // Neon/pgbouncer: disable prepared statements to avoid "prepared statement does not exist" errors
  ...(isNeon && { allowExitOnIdle: true })
});

pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL pool error:", error.message);
});

export async function checkDatabaseConnection(): Promise<void> {
  const result = await pool.query("SELECT NOW() AS current_time");
  console.log("Connected to PostgreSQL:", result.rows[0].current_time);
}