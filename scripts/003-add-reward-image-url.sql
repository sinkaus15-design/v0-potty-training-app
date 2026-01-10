-- Add image_url column to rewards table for custom reward images
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS image_url TEXT;
