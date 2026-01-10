-- Create storage bucket for reward images
-- Note: Run this in Supabase SQL editor or dashboard

INSERT INTO storage.buckets (id, name, public)
VALUES ('reward-images', 'reward-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload reward images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'reward-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Policy to allow public read access
CREATE POLICY "Public can view reward images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'reward-images');

-- Policy to allow users to delete their own images
CREATE POLICY "Users can delete their reward images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'reward-images' AND (storage.foldername(name))[1] = auth.uid()::text);
