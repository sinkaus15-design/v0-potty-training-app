-- Multi-Child Support Migration
-- Adds support for multiple children per account

-- Create children table (separate from profiles)
-- Each user account can have multiple children
CREATE TABLE IF NOT EXISTS children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  child_name TEXT NOT NULL,
  child_age INTEGER,
  total_points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update bathroom_requests to reference children instead of profiles
-- First, add the new column
ALTER TABLE bathroom_requests 
  ADD COLUMN IF NOT EXISTS child_id UUID REFERENCES children(id) ON DELETE CASCADE;

-- Update rewards to reference children
ALTER TABLE rewards 
  ADD COLUMN IF NOT EXISTS child_id UUID REFERENCES children(id) ON DELETE CASCADE;

-- Update redeemed_rewards to reference children
ALTER TABLE redeemed_rewards 
  ADD COLUMN IF NOT EXISTS child_id UUID REFERENCES children(id) ON DELETE CASCADE;

-- Update caregivers to reference children (optional - can stay per user)
-- For now, we'll keep caregivers at the user level but they can manage all children

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_children_user ON children(user_id);
CREATE INDEX IF NOT EXISTS idx_bathroom_requests_child ON bathroom_requests(child_id);
CREATE INDEX IF NOT EXISTS idx_rewards_child ON rewards(child_id);
CREATE INDEX IF NOT EXISTS idx_redeemed_rewards_child ON redeemed_rewards(child_id);

-- Enable RLS on children table
ALTER TABLE children ENABLE ROW LEVEL SECURITY;

-- RLS Policies for children
CREATE POLICY "Users can view their children" ON children FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their children" ON children FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their children" ON children FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their children" ON children FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for bathroom_requests with child_id
CREATE POLICY "Users can view requests for their children" ON bathroom_requests FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM children 
      WHERE children.id = bathroom_requests.child_id 
      AND children.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert requests for their children" ON bathroom_requests FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM children 
      WHERE children.id = bathroom_requests.child_id 
      AND children.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update requests for their children" ON bathroom_requests FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM children 
      WHERE children.id = bathroom_requests.child_id 
      AND children.user_id = auth.uid()
    )
  );

-- RLS Policies for rewards with child_id
CREATE POLICY "Users can view rewards for their children" ON rewards FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM children 
      WHERE children.id = rewards.child_id 
      AND children.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert rewards for their children" ON rewards FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM children 
      WHERE children.id = rewards.child_id 
      AND children.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update rewards for their children" ON rewards FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM children 
      WHERE children.id = rewards.child_id 
      AND children.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete rewards for their children" ON rewards FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM children 
      WHERE children.id = rewards.child_id 
      AND children.user_id = auth.uid()
    )
  );

-- RLS Policies for redeemed_rewards with child_id
CREATE POLICY "Users can view redeemed rewards for their children" ON redeemed_rewards FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM children 
      WHERE children.id = redeemed_rewards.child_id 
      AND children.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert redeemed rewards for their children" ON redeemed_rewards FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM children 
      WHERE children.id = redeemed_rewards.child_id 
      AND children.user_id = auth.uid()
    )
  );

-- Migration function to move existing profile data to children table
-- This will be run once for existing users
CREATE OR REPLACE FUNCTION migrate_profile_to_children()
RETURNS void AS $$
DECLARE
  profile_record RECORD;
  new_child_id UUID;
BEGIN
  -- For each existing profile, create a child
  FOR profile_record IN 
    SELECT * FROM profiles
  LOOP
    -- Create child from profile
    INSERT INTO children (user_id, child_name, child_age, total_points, created_at, updated_at)
    VALUES (
      profile_record.id,
      profile_record.child_name,
      profile_record.child_age,
      profile_record.total_points,
      profile_record.created_at,
      profile_record.updated_at
    )
    RETURNING id INTO new_child_id;
    
    -- Migrate bathroom_requests
    UPDATE bathroom_requests 
    SET child_id = new_child_id 
    WHERE profile_id = profile_record.id AND child_id IS NULL;
    
    -- Migrate rewards
    UPDATE rewards 
    SET child_id = new_child_id 
    WHERE profile_id = profile_record.id AND child_id IS NULL;
    
    -- Migrate redeemed_rewards
    UPDATE redeemed_rewards 
    SET child_id = new_child_id 
    WHERE profile_id = profile_record.id AND child_id IS NULL;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Note: Run migrate_profile_to_children() manually after this migration
-- SELECT migrate_profile_to_children();
