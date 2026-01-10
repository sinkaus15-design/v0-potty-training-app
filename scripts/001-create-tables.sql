-- PottyPal Database Schema
-- Creates all necessary tables for the potty training app

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  child_name TEXT NOT NULL,
  child_age INTEGER,
  caregiver_passcode TEXT NOT NULL DEFAULT '0000',
  total_points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Caregivers table (multiple caregivers per account)
CREATE TABLE caregivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  receive_notifications BOOLEAN DEFAULT true,
  push_subscription JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bathroom requests table
CREATE TABLE bathroom_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL CHECK (request_type IN ('pee', 'poop')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  points_awarded INTEGER DEFAULT 0,
  completed_by UUID REFERENCES caregivers(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Rewards catalog table
CREATE TABLE rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  points_cost INTEGER NOT NULL,
  icon TEXT DEFAULT 'star',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Redeemed rewards table
CREATE TABLE redeemed_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
  points_spent INTEGER NOT NULL,
  redeemed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE caregivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bathroom_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE redeemed_rewards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for caregivers
CREATE POLICY "Users can view their caregivers" ON caregivers FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Users can insert caregivers" ON caregivers FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Users can update their caregivers" ON caregivers FOR UPDATE USING (auth.uid() = profile_id);
CREATE POLICY "Users can delete their caregivers" ON caregivers FOR DELETE USING (auth.uid() = profile_id);

-- RLS Policies for bathroom_requests
CREATE POLICY "Users can view their requests" ON bathroom_requests FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Users can insert requests" ON bathroom_requests FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Users can update their requests" ON bathroom_requests FOR UPDATE USING (auth.uid() = profile_id);

-- RLS Policies for rewards
CREATE POLICY "Users can view their rewards" ON rewards FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Users can insert rewards" ON rewards FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Users can update their rewards" ON rewards FOR UPDATE USING (auth.uid() = profile_id);
CREATE POLICY "Users can delete their rewards" ON rewards FOR DELETE USING (auth.uid() = profile_id);

-- RLS Policies for redeemed_rewards
CREATE POLICY "Users can view their redeemed rewards" ON redeemed_rewards FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Users can insert redeemed rewards" ON redeemed_rewards FOR INSERT WITH CHECK (auth.uid() = profile_id);

-- Create indexes for better performance
CREATE INDEX idx_bathroom_requests_profile ON bathroom_requests(profile_id);
CREATE INDEX idx_bathroom_requests_status ON bathroom_requests(status);
CREATE INDEX idx_caregivers_profile ON caregivers(profile_id);
CREATE INDEX idx_rewards_profile ON rewards(profile_id);
