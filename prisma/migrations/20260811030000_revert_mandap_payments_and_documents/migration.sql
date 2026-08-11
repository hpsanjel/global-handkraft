-- Reverts the custom mandap/temple order deposit-payment tracking added in
-- 20260811010000_add_mandap_inquiry_payments and the export/document fields
-- added in 20260811020000_add_mandap_document_fields. The in-app Pay Now
-- checkout flow and the pro forma invoice / deposit receipt document system
-- built on top of it were removed from the application; this rolls back
-- their schema so the database matches the current code.

DROP TABLE IF EXISTS "MandapInquiryTransaction";

ALTER TABLE "MandapInquiry" DROP CONSTRAINT IF EXISTS "MandapInquiry_addressId_fkey";
DROP INDEX IF EXISTS "MandapInquiry_addressId_idx";
DROP INDEX IF EXISTS "MandapInquiry_fulfillmentStatus_idx";

ALTER TABLE "MandapInquiry" DROP COLUMN IF EXISTS "depositAmount";
ALTER TABLE "MandapInquiry" DROP COLUMN IF EXISTS "amountPaid";
ALTER TABLE "MandapInquiry" DROP COLUMN IF EXISTS "addressId";
ALTER TABLE "MandapInquiry" DROP COLUMN IF EXISTS "weightKg";
ALTER TABLE "MandapInquiry" DROP COLUMN IF EXISTS "hsCode";
ALTER TABLE "MandapInquiry" DROP COLUMN IF EXISTS "incoterm";
ALTER TABLE "MandapInquiry" DROP COLUMN IF EXISTS "fulfillmentStatus";
ALTER TABLE "MandapInquiry" DROP COLUMN IF EXISTS "referenceNumber";
ALTER TABLE "MandapInquiry" DROP COLUMN IF EXISTS "invoiceNumber";
