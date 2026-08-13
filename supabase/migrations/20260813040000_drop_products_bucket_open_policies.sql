-- Removes two overly-broad policies on storage.objects for the `products`
-- bucket, flagged by Supabase's Security Advisor ("Clients can list all
-- files in this bucket").
--
-- Context: live inspection (pg_policies) showed the `products` bucket had:
--   * a SELECT policy with no restriction, letting anyone enumerate every
--     object in the bucket via the Storage list API -- unnecessary, since
--     the bucket is `public`, so direct object downloads already work
--     without any RLS policy.
--   * an INSERT policy with an empty WITH CHECK, letting anyone holding the
--     public anon key upload arbitrary files, unauthenticated.
-- Neither policy is used by the app: every upload/delete/update across
-- products, categories, testimonials, and mandap-inquiries goes through the
-- service-role client (lib/supabase/admin.ts), which bypasses RLS entirely.
-- These policies existed only as an external attack surface.
--
-- Note: this diverges from the checked-in
-- `20240101000000_storage_rls_policies.sql`, which defines a different
-- (admin-gated) policy set that was apparently never fully applied to the
-- live database -- only two ad-hoc policies existed in practice. This
-- migration brings `products` in line with the other three buckets
-- (categories, mandap-inquiries, testimonials), which already have zero
-- storage.objects policies and rely on the bucket's public flag for reads
-- and the service-role client for writes.

DROP POLICY IF EXISTS "Anyone can read products" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload to products" ON storage.objects;

-- To verify: SELECT policyname FROM pg_policies WHERE schemaname = 'storage'
-- AND tablename = 'objects'; should return zero rows across all buckets.
