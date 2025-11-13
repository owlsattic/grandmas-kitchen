-- Create storage bucket for recipe images
INSERT INTO storage.buckets (id, name, public)
VALUES ('recipe-images', 'recipe-images', true);

-- Allow authenticated users to upload recipe images
CREATE POLICY "Authenticated users can upload recipe images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'recipe-images' AND auth.uid() IS NOT NULL);

-- Allow authenticated users to update their own recipe images
CREATE POLICY "Users can update their own recipe images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'recipe-images' AND auth.uid() IS NOT NULL);

-- Allow authenticated users to delete their own recipe images
CREATE POLICY "Users can delete their own recipe images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'recipe-images' AND auth.uid() IS NOT NULL);

-- Allow public read access to recipe images
CREATE POLICY "Public read access to recipe images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'recipe-images');