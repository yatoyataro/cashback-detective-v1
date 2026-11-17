-- Cashback Detective Initial Schema
-- Compatible with PostgreSQL and Neon serverless

-- Merchant policies table
CREATE TABLE IF NOT EXISTS merchant_policies (
  merchant_name TEXT PRIMARY KEY,
  investigation_after_days INTEGER NOT NULL
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY CHECK (id ~ '^TX-[0-9]{4}$'),
  user_id TEXT NOT NULL CHECK (user_id ~ '^USER-\d+$'),
  merchant_name TEXT NOT NULL REFERENCES merchant_policies(merchant_name),
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  cashback_amount NUMERIC(12,2) NOT NULL CHECK (cashback_amount >= 0),
  days_since_purchase INTEGER NOT NULL CHECK (days_since_purchase >= 0 AND days_since_purchase <= 36500),
  status TEXT NOT NULL CHECK (status IN ('pending','canceled','returned','credited')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_merchant ON transactions(merchant_name);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);