-- =========================================
-- St. Kizito Parish — Supabase Schema
-- Run in: Supabase Dashboard → SQL Editor
-- =========================================

-- ANNOUNCEMENTS
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT CHECK (type IN ('liturgical', 'parish')),
  published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- EVENTS
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  location TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- MASS TIMES
CREATE TABLE IF NOT EXISTS mass_times (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week TEXT NOT NULL CHECK (day_of_week IN ('Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday')),
  time TIME NOT NULL,
  location TEXT,
  type TEXT
);

-- PARISH PAYMENT DETAILS
CREATE TABLE IF NOT EXISTS parish_payment_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_name TEXT NOT NULL,
  account_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================
-- PARISH CONTACT DETAILS
-- =========================================
CREATE TABLE IF NOT EXISTS parish_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL,
  name TEXT NOT NULL,
  detail TEXT,
  phone TEXT NOT NULL,
  whatsapp_phone TEXT,
  icon TEXT,
  accent TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE parish_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read parish contacts" ON parish_contacts FOR SELECT USING (TRUE);
CREATE POLICY "Admins manage parish contacts" ON parish_contacts FOR ALL USING (auth.role() = 'authenticated');

-- BOOKINGS
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'mass_intention' CHECK (type IN ('mass_intention', 'thanksgiving')),
  intention TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  mass_time_id UUID REFERENCES mass_times(id) ON DELETE SET NULL,
  payment_name TEXT,
  payment_reference TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- DONATIONS
CREATE TABLE IF NOT EXISTS donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amount NUMERIC(12, 2) NOT NULL,
  is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
  donor_name TEXT,
  purpose TEXT,
  message TEXT,
  payment_name TEXT,
  payment_reference TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure optional donation fields exist for existing deployments
ALTER TABLE donations ADD COLUMN IF NOT EXISTS purpose TEXT;
ALTER TABLE donations ADD COLUMN IF NOT EXISTS message TEXT;

-- =========================================
-- ROW LEVEL SECURITY
-- =========================================

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE mass_times ENABLE ROW LEVEL SECURITY;
ALTER TABLE parish_payment_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE parish_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

-- Announcements
CREATE POLICY "Public read published announcements" ON announcements
  FOR SELECT USING (published = TRUE);
CREATE POLICY "Admins manage announcements" ON announcements
  FOR ALL USING (auth.role() = 'authenticated');

-- Events
CREATE POLICY "Public read events" ON events FOR SELECT USING (TRUE);
CREATE POLICY "Admins manage events" ON events FOR ALL USING (auth.role() = 'authenticated');

-- Mass Times
CREATE POLICY "Public read mass times" ON mass_times FOR SELECT USING (TRUE);
CREATE POLICY "Admins manage mass times" ON mass_times FOR ALL USING (auth.role() = 'authenticated');

-- Payment Details
CREATE POLICY "Public read payment details" ON parish_payment_details FOR SELECT USING (TRUE);
CREATE POLICY "Admins manage payment details" ON parish_payment_details FOR ALL USING (auth.role() = 'authenticated');

-- Contact Details
DROP POLICY IF EXISTS "Public read active contacts" ON parish_contacts;
DROP POLICY IF EXISTS "Admins manage contacts" ON parish_contacts;
DROP POLICY IF EXISTS "Admins insert contacts" ON parish_contacts;
DROP POLICY IF EXISTS "Admins update contacts" ON parish_contacts;
DROP POLICY IF EXISTS "Admins delete contacts" ON parish_contacts;

CREATE POLICY "Public read active contacts" ON parish_contacts FOR SELECT USING (active = TRUE);
CREATE POLICY "Admins insert contacts" ON parish_contacts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admins update contacts" ON parish_contacts FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admins delete contacts" ON parish_contacts FOR DELETE USING (auth.role() = 'authenticated');

-- Bookings
CREATE POLICY "Anyone can submit bookings" ON bookings FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Admins manage bookings" ON bookings FOR ALL USING (auth.role() = 'authenticated');

-- Donations
CREATE POLICY "Anyone can submit donations" ON donations FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Admins manage donations" ON donations FOR ALL USING (auth.role() = 'authenticated');

-- =========================================
-- NOTE: After running this, go to:
-- Supabase → Authentication → Users → Invite User
-- Create your admin account for the /admin/login page
-- =========================================
