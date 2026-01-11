-- Add caregiver_display_name column to profiles table for customizing caregiver button name
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS caregiver_display_name TEXT;
