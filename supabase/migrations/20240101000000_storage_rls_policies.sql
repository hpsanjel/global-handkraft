-- Storage RLS Policies for Defense-in-Depth Security
-- These policies provide an additional layer of security beyond the service-role key
-- Run this migration in your Supabase SQL Editor

-- ============================================
-- PRODUCTS BUCKET
-- ============================================

-- Allow public read access for product images
CREATE POLICY "Public product images are viewable by everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'products');

-- Allow authenticated admins to upload product images
CREATE POLICY "Admins can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'products' 
  AND auth.uid() IN (
    SELECT id FROM auth.users 
    WHERE raw_user_meta_data->>'role' = 'admin'
  )
);

-- Allow authenticated admins to delete product images
CREATE POLICY "Admins can delete product images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'products' 
  AND auth.uid() IN (
    SELECT id FROM auth.users 
    WHERE raw_user_meta_data->>'role' = 'admin'
  )
);

-- Allow authenticated admins to update product images
CREATE POLICY "Admins can update product images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'products' 
  AND auth.uid() IN (
    SELECT id FROM auth.users 
    WHERE raw_user_meta_data->>'role' = 'admin'
  )
);

-- ============================================
-- CATEGORIES BUCKET
-- ============================================

-- Allow public read access for category images
CREATE POLICY "Public category images are viewable by everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'categories');

-- Allow authenticated admins to upload category images
CREATE POLICY "Admins can upload category images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'categories' 
  AND auth.uid() IN (
    SELECT id FROM auth.users 
    WHERE raw_user_meta_data->>'role' = 'admin'
  )
);

-- Allow authenticated admins to delete category images
CREATE POLICY "Admins can delete category images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'categories' 
  AND auth.uid() IN (
    SELECT id FROM auth.users 
    WHERE raw_user_meta_data->>'role' = 'admin'
  )
);

-- Allow authenticated admins to update category images
CREATE POLICY "Admins can update category images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'categories' 
  AND auth.uid() IN (
    SELECT id FROM auth.users 
    WHERE raw_user_meta_data->>'role' = 'admin'
  )
);

-- ============================================
-- MANDAP INQUIRIES BUCKET
-- ============================================

-- Allow public read access for mandap inquiry images
CREATE POLICY "Public mandap inquiry images are viewable by everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'mandap-inquiries');

-- Allow authenticated admins to upload mandap inquiry images
CREATE POLICY "Admins can upload mandap inquiry images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'mandap-inquiries' 
  AND auth.uid() IN (
    SELECT id FROM auth.users 
    WHERE raw_user_meta_data->>'role' = 'admin'
  )
);

-- Allow authenticated admins to delete mandap inquiry images
CREATE POLICY "Admins can delete mandap inquiry images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'mandap-inquiries' 
  AND auth.uid() IN (
    SELECT id FROM auth.users 
    WHERE raw_user_meta_data->>'role' = 'admin'
  )
);

-- Allow authenticated admins to update mandap inquiry images
CREATE POLICY "Admins can update mandap inquiry images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'mandap-inquiries' 
  AND auth.uid() IN (
    SELECT id FROM auth.users 
    WHERE raw_user_meta_data->>'role' = 'admin'
  )
);

-- ============================================
-- NOTES
-- ============================================
-- These policies use the 'role' field in raw_user_meta_data to identify admins.
-- This matches the existing auth callback logic in app/auth/callback/route.ts
-- The policies provide defense-in-depth even though the code uses service-role keys.
-- 
-- To verify these policies are active, run:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename = 'objects' AND schemaname = 'storage';