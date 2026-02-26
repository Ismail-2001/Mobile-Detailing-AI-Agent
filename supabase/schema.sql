-- MR. CLEANER MOBILE DETAILING - DATABASE SCHEMA

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  vehicle_type TEXT NOT NULL, -- sedan, SUV, truck, large SUV
  service TEXT NOT NULL,      -- Basic Wash & Wax, Premium Detail, Full Detailing
  service_price DECIMAL(10,2) NOT NULL,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL, -- 08:00:00, 11:00:00, 14:00:00
  address TEXT,
  zip_code TEXT,
  status TEXT DEFAULT 'pending', -- pending, confirmed, cancelled, completed
  google_event_id TEXT,
  sms_sent BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Create policy to allow the service role to do everything
CREATE POLICY "Allow all to service role" ON bookings
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create policy to allow anonymous users to insert (from the chat)
-- In production, you'd want to tighten this with rate limiting
CREATE POLICY "Allow anon insert" ON bookings
  FOR INSERT
  WITH CHECK (true);

-- Create policy to allow public read (simple demo dashboard)
-- In production, protect this behind authentication
CREATE POLICY "Allow public select" ON bookings
  FOR SELECT
  USING (true);
