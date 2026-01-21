import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables here

let pool: Pool | null = null;

const getPool = () => {
  if (pool) {
    return pool;
  }

  pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || "5432", 10), // Convert port to number, default to 5432
  });

  return pool;
};

export const dbPool = getPool();

export const initDatabase = async () => {
  try {
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS carts (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL,
        items JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await dbPool.query(`
      CREATE INDEX IF NOT EXISTS idx_carts_user_id ON carts(user_id);
    `);
    console.log("Database schema initialized successfully.");
  } catch (error) {
    console.error("Error initializing database schema:", error);
    process.exit(1); // Exit if schema can't be created
  }
};
