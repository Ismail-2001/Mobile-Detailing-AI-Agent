-- MIGRATION: Add business_knowledge table + performance indexes
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_chat_sessions_last_active ON chat_sessions (last_active);
CREATE INDEX IF NOT EXISTS idx_usage_logs_session_id ON usage_logs (session_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON usage_logs (created_at);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings (status);

-- BUSINESS KNOWLEDGE TABLE
-- Stores pricing, service area, and FAQ data that the AI agent uses.
-- Falls back to hardcoded data in tools.js if this table is empty.
CREATE TABLE IF NOT EXISTS business_knowledge (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE business_knowledge ENABLE ROW LEVEL SECURITY;

-- No anon policies = anon cannot access business knowledge.
-- Service role bypasses RLS.

-- SEED DATA: Populate with initial knowledge if table is empty
INSERT INTO business_knowledge (id, data) VALUES
  ('pricing', '{
    "sedan": {"basic": 89, "premium": 189, "full": 289},
    "SUV": {"basic": 109, "premium": 219, "full": 329},
    "truck": {"basic": 119, "premium": 239, "full": 359},
    "large_suv": {"basic": 129, "premium": 259, "full": 389}
  }'),
  ('service_area', '{
    "zip_codes": ["78613", "78617", "78660", "78664", "78681", "78704", "78745", "78749"]
  }'),
  ('faq', '[
    {"question": "How long does a detail take?", "answer": "Basic wash: 1-2 hours. Premium detail: 3-4 hours. Full detailing: 5-6 hours."},
    {"question": "Do you come to my location?", "answer": "Yes! We are a mobile service. We come to your home, office, or any location in our service area."},
    {"question": "What payment methods do you accept?", "answer": "We accept all major credit cards via secure online payment. A $50 deposit is required to book."}
  ]')
ON CONFLICT (id) DO NOTHING;
