-- Cashback Detective Seed Data
-- Demo data matching the existing evaluation cases

-- Insert merchant policies
INSERT INTO merchant_policies (merchant_name, investigation_after_days) VALUES
  ('Amazon', 14),
  ('eBay', 21),
  ('Walmart', 14),
  ('Target', 14),
  ('Best Buy', 30)
ON CONFLICT (merchant_name) DO UPDATE SET investigation_after_days = EXCLUDED.investigation_after_days;

-- Insert demo transactions
-- TX-1001: Still pending (Amazon, 5 days since purchase, investigation_after_days=14)
-- TX-1002: Eligible for investigation (Amazon, 20 days since purchase, investigation_after_days=14)
-- TX-1003: Canceled transaction
-- TX-1004: Already credited
INSERT INTO transactions (id, user_id, merchant_name, amount, cashback_amount, days_since_purchase, status) VALUES
  ('TX-1001', 'USER-1', 'Amazon', 150.00, 7.50, 5, 'pending'),
  ('TX-1002', 'USER-1', 'Amazon', 200.00, 10.00, 20, 'pending'),
  ('TX-1003', 'USER-2', 'Walmart', 75.00, 3.75, 10, 'canceled'),
  ('TX-1004', 'USER-3', 'Target', 300.00, 15.00, 30, 'credited')
ON CONFLICT (id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  merchant_name = EXCLUDED.merchant_name,
  amount = EXCLUDED.amount,
  cashback_amount = EXCLUDED.cashback_amount,
  days_since_purchase = EXCLUDED.days_since_purchase,
  status = EXCLUDED.status;