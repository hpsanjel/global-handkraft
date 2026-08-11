-- Export/shipping paperwork + staged-payment document fields for MandapInquiry.
-- MandapInquiry has no shipping address at all today (only email/WhatsApp) and
-- no weight/HS code/Incoterm/reference-number fields, all required to generate
-- Pro Forma, Deposit Receipt, Commercial Invoice, Packing List, Customs Invoice
-- and Shipping Summary documents for custom mandap/temple orders.
ALTER TABLE "MandapInquiry"
ADD COLUMN IF NOT EXISTS "addressId" TEXT,
ADD COLUMN IF NOT EXISTS "weightKg" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "hsCode" TEXT,
ADD COLUMN IF NOT EXISTS "incoterm" TEXT,
ADD COLUMN IF NOT EXISTS "fulfillmentStatus" TEXT NOT NULL DEFAULT 'AWAITING_PRODUCTION',
ADD COLUMN IF NOT EXISTS "referenceNumber" TEXT,
ADD COLUMN IF NOT EXISTS "invoiceNumber" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'MandapInquiry_addressId_fkey'
  ) THEN
    ALTER TABLE "MandapInquiry"
    ADD CONSTRAINT "MandapInquiry_addressId_fkey"
    FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "MandapInquiry_addressId_idx" ON "MandapInquiry"("addressId");
CREATE INDEX IF NOT EXISTS "MandapInquiry_fulfillmentStatus_idx" ON "MandapInquiry"("fulfillmentStatus");
