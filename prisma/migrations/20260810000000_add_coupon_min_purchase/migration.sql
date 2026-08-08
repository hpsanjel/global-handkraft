-- Add minimum purchase amount condition to coupons; backfill existing coupons to 1500 NOK
ALTER TABLE "Coupon" ADD COLUMN IF NOT EXISTS "minPurchaseAmount" DOUBLE PRECISION;

UPDATE "Coupon" SET "minPurchaseAmount" = 1500 WHERE "minPurchaseAmount" IS NULL;
