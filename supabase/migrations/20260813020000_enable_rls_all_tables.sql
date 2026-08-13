-- Enable Row Level Security on every table in the public schema
-- (Prisma-managed application data), with no policies attached.
--
-- Context: the app talks to Postgres exclusively through Prisma, using the
-- `postgres` connection-pooler role (see DATABASE_URL / DIRECT_URL). That
-- role has BYPASSRLS, so enabling RLS here has NO effect on the app's own
-- reads/writes -- Prisma keeps working exactly as before.
--
-- What this DOES fix: Supabase auto-exposes every public-schema table over
-- its PostgREST Data API (https://<project>.supabase.co/rest/v1/<table>),
-- and the `anon`/`authenticated` Postgres roles used by that API do NOT
-- have BYPASSRLS. With RLS disabled, anyone holding the publishable/anon
-- key (which is a NEXT_PUBLIC_ env var, i.e. shipped to every browser) can
-- currently read/write these tables directly, bypassing the Next.js app
-- entirely -- including Order, Address, User, PendingCheckout, and
-- ContactMessage.
--
-- The app never queries these tables via supabase-js (`.from(...)`) -- only
-- via Prisma -- so the correct policy set is "none": enabling RLS with zero
-- policies denies all access to `anon`/`authenticated` by default while
-- leaving Prisma untouched. If a future feature needs the browser client to
-- read one of these tables directly, add a narrowly-scoped SELECT policy
-- for that table at that time.

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Subscriber" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Category" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Variant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Addon" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Address" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PendingCheckout" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrderStatusEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrderItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Review" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Coupon" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VATRate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ShippingZone" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PriceZone" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PriceZoneCountry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SiteSettings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "NewsletterSubscriber" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ContactMessage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GalleryImage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DocumentCounter" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MandapInquiry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MandapInquiryMessage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MandapPaymentTransaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Testimonial" ENABLE ROW LEVEL SECURITY;

-- Prisma's own migration-history table. Also public-schema, also exposed by
-- PostgREST today. Never accessed by the app at runtime (only by `prisma
-- migrate` over the direct/bypassing connection), so lock it down too.
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;

-- ============================================
-- NOTES
-- ============================================
-- No CREATE POLICY statements: RLS enabled + zero policies = deny-all for
-- `anon` and `authenticated`, which is correct here since nothing in the
-- app reads/writes these tables through supabase-js.
--
-- To verify after applying:
--   SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
-- `rowsecurity` should be `t` for every row.
--
-- To confirm the Data API is actually closed, from a machine with the
-- publishable/anon key (no Authorization/service-role header):
--   curl "https://<project>.supabase.co/rest/v1/Order?select=*" \
--     -H "apikey: <anon-key>"
-- should return an empty array / 401, not order data.
